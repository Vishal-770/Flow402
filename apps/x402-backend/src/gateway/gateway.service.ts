import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';
import { eq, or, sql } from 'drizzle-orm';
import { ThirdwebService } from '../thirdweb/thirdweb.service';
import { settlePayment } from 'thirdweb/x402';
import { defineChain } from 'thirdweb/chains';
import axios from 'axios';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

function getHeaderValue(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header === 'string') {
    return header;
  }
  if (Array.isArray(header) && header.length > 0) {
    return header[0];
  }
  return undefined;
}

function setHeaders(
  res: Response,
  headers: Record<string, unknown> | undefined,
): void {
  if (!headers) {
    return;
  }

  const serializeHeaderValue = (input: unknown): string | undefined => {
    if (input === undefined || input === null) {
      return undefined;
    }
    if (
      typeof input === 'string' ||
      typeof input === 'number' ||
      typeof input === 'boolean'
    ) {
      return String(input);
    }
    try {
      return JSON.stringify(input);
    } catch {
      return undefined;
    }
  };

  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'payment-required') {
      // Alias facilitator header name to what thirdweb fetchWithPayment expects.
      if (Array.isArray(value)) {
        const mapped = value
          .map((v) => serializeHeaderValue(v))
          .filter((v): v is string => v !== undefined);
        res.setHeader('payment-required', mapped);
        res.setHeader('x-payment-required', mapped);
      } else {
        const mapped = serializeHeaderValue(value);
        if (!mapped) {
          return;
        }
        res.setHeader('payment-required', mapped);
        res.setHeader('x-payment-required', mapped);
      }
      return;
    }

    if (Array.isArray(value)) {
      const mapped = value
        .map((v) => serializeHeaderValue(v))
        .filter((v): v is string => v !== undefined);
      if (mapped.length === 0) {
        return;
      }
      res.setHeader(key, mapped);
      return;
    }
    const mapped = serializeHeaderValue(value);
    if (mapped !== undefined) {
      res.setHeader(key, mapped);
    }
  });
}

function hasUsableX402Headers(
  headers: Record<string, unknown> | undefined,
): boolean {
  if (!headers) {
    return false;
  }

  const keys = Object.keys(headers).map((key) => key.toLowerCase());
  return (
    keys.includes('x-payment-required') ||
    keys.includes('payment-required') ||
    keys.includes('www-authenticate')
  );
}

@Injectable()
export class GatewayService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private thirdwebService: ThirdwebService,
  ) {}

  async handleProxy(
    gatewayPath: string,
    remainingPath: string,
    req: Request,
    res: Response,
  ) {
    const startTime = Date.now();
    let callerWallet = 'unknown';
    let status: 'success' | 'failed' = 'failed';
    let errorMessage: string | null = null;
    let endpointId: string | null = null;
    let priceAmount = '0';

    try {
      const searchPath = gatewayPath.trim();
      const lowSearchPath = searchPath.toLowerCase();

      // 1. Fetch API details from DB with joins
      const [endpoint] = await this.db
        .select({
          id: schema.apiEndpoints.id,
          providerUrl: schema.apiEndpoints.providerUrl,
          priceAmount: schema.apiEndpoints.priceAmount,
          isActive: schema.apiEndpoints.isActive,
          assetAddress: schema.tokens.contractAddress,
          decimals: schema.tokens.decimals,
          chainId: schema.chains.chainId,
          payTo: schema.wallets.address,
        })
        .from(schema.apiEndpoints)
        .innerJoin(
          schema.tokens,
          eq(schema.apiEndpoints.tokenId, schema.tokens.id),
        )
        .innerJoin(schema.chains, eq(schema.tokens.chainId, schema.chains.id))
        .innerJoin(
          schema.wallets,
          eq(schema.apiEndpoints.walletId, schema.wallets.id),
        )
        .where(
          or(
            eq(sql`LOWER(${schema.apiEndpoints.gatewayPath})`, lowSearchPath),
            eq(
              sql`LOWER(${schema.apiEndpoints.gatewayPath})`,
              `/${lowSearchPath}`,
            ),
          ),
        )
        .limit(1);

      if (!endpoint) {
        throw new NotFoundException(
          `API Endpoint with path ${gatewayPath} not found.`,
        );
      }

      if (!endpoint.isActive) {
        throw new ForbiddenException(
          `API Endpoint /${searchPath} is currently INACTIVE. Please enable it in your dashboard.`,
        );
      }

      endpointId = endpoint.id;
      priceAmount = endpoint.priceAmount;

      const paymentData =
        getHeaderValue(req.headers['payment-signature']) ??
        getHeaderValue(req.headers['x-payment']) ??
        null;
      if (paymentData) {
        try {
          // Try to extract wallet from x-payment header (usually contains payment intent/proof)
          const parsed = JSON.parse(paymentData);
          callerWallet = parsed.sender || parsed.signer || 'unknown';
        } catch (e) {
          // Not JSON or missing fields, keep unknown
        }
      }

      // 2. Settle Payment via Thirdweb x402
      let result: Awaited<ReturnType<typeof settlePayment>>;
      const originalUrl = req.originalUrl || '';
      const queryIndex = originalUrl.indexOf('?');
      const querySuffix = queryIndex >= 0 ? originalUrl.slice(queryIndex) : '';
      try {
        result = await settlePayment({
          resourceUrl: `${endpoint.providerUrl}${remainingPath}${querySuffix}`,
          method: req.method,
          paymentData,
          payTo: endpoint.payTo as `0x${string}`,
          network: defineChain(Number(endpoint.chainId)),
          price: {
            amount: endpoint.priceAmount,
            asset: {
              address: endpoint.assetAddress as `0x${string}`,
            },
          },
          facilitator: this.thirdwebService.thirdwebFacilitator,
        });
      } catch (settleError: unknown) {
        status = 'failed';
        const settleErrorMessage = getErrorMessage(settleError);
        errorMessage = settleErrorMessage;
        console.error('Settle Payment error:', settleErrorMessage);

        if (settleErrorMessage.includes('No supported signature scheme')) {
          errorMessage = `X402 Configuration Error: Unsupported payment signature scheme for chainId=${endpoint.chainId}, token=${endpoint.assetAddress}. Verify token, chain, and facilitator support.`;
        }

        const responseStatus =
          typeof settleError === 'object' &&
          settleError !== null &&
          'responseStatus' in settleError &&
          typeof (settleError as { responseStatus?: unknown })
            .responseStatus === 'number'
            ? (settleError as { responseStatus: number }).responseStatus
            : undefined;
        const responseHeaders =
          typeof settleError === 'object' &&
          settleError !== null &&
          'responseHeaders' in settleError
            ? (settleError as { responseHeaders?: Record<string, unknown> })
                .responseHeaders
            : undefined;
        const responseBody =
          typeof settleError === 'object' &&
          settleError !== null &&
          'responseBody' in settleError
            ? (settleError as { responseBody?: unknown }).responseBody
            : undefined;

        if (responseStatus === 402 && hasUsableX402Headers(responseHeaders)) {
          setHeaders(res, responseHeaders);
          return res.status(402).json(
            responseBody ?? {
              error: 'Payment Required',
            },
          );
        }

        return res.status(500).json({
          success: false,
          message: errorMessage || 'Failed to create x402 payment challenge',
          error: 'X402 Settlement Error',
        });
      }

      if (result.status === 200) {
        status = 'success';
        // 3. Payment Success - Proxy to Upstream Provider
        const targetUrl = new URL(
          remainingPath || '',
          endpoint.providerUrl,
        ).toString();

        // Fetch defined upstream headers from DB
        const upstreamHeadersRows = await this.db
          .select({
            name: schema.apiUpstreamHeaders.headerName,
            value: schema.apiUpstreamHeaders.headerValue,
          })
          .from(schema.apiUpstreamHeaders)
          .where(eq(schema.apiUpstreamHeaders.apiEndpointId, endpoint.id));

        const upstreamHeaders: Record<string, string> = {
          // Essential headers for proxying
          host: new URL(endpoint.providerUrl).host,
        };

        // Use only headers defined in the database
        upstreamHeadersRows.forEach((h) => {
          upstreamHeaders[h.name.toLowerCase()] = h.value;
        });

        // Fallback for Content-Type if it's missing from DB but present in request (essential for body)
        if (!upstreamHeaders['content-type'] && req.headers['content-type']) {
          upstreamHeaders['content-type'] = req.headers['content-type'];
        }

        try {
          const proxyResponse = await axios({
            method: req.method,
            url: targetUrl,
            headers: upstreamHeaders,
            data: req.body,
            params: req.query,
            validateStatus: () => true, // Allow all statuses to pass through
          });

          // Set provider headers and send response
          setHeaders(res, proxyResponse.headers as Record<string, unknown>);
          return res.status(proxyResponse.status).send(proxyResponse.data);
        } catch (proxyError: unknown) {
          status = 'failed';
          errorMessage = getErrorMessage(proxyError);
          console.error('Proxying error:', errorMessage);
          throw new InternalServerErrorException(
            'Failed to proxy request to upstream provider',
          );
        }
      } else {
        status = 'failed';
        errorMessage =
          typeof result.responseBody === 'string'
            ? result.responseBody
            : ('errorMessage' in result.responseBody
                ? result.responseBody.errorMessage
                : undefined) || 'Payment required';

        // 4. Payment Required or Failed
        // Forward Thirdweb's special headers and response body (402 Payment Required)
        setHeaders(res, result.responseHeaders);
        return res.status(result.status).json(result.responseBody);
      }
    } catch (error: unknown) {
      if (!(error instanceof NotFoundException)) {
        status = 'failed';
        errorMessage = getErrorMessage(error);
      }
      console.error('Gateway Error:', error);
      throw error;
    } finally {
      // Async log to DB (don't wait for it to respond to user faster)
      if (endpointId) {
        const latencyMs = Date.now() - startTime;
        this.db
          .insert(schema.apiCalls)
          .values({
            id: crypto.randomUUID(),
            apiEndpointId: endpointId,
            callerWallet,
            priceAmount,
            status,
            errorMessage: errorMessage?.substring(0, 255) || null,
            latencyMs,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute()
          .catch((err) => console.error('Failed to log API call:', err));
      }
    }
  }
}

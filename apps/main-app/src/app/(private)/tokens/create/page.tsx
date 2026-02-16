"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { createTokenSchema, type CreateTokenInput } from "@/src/lib/validators/token";
import { uploadImage } from "@/src/lib/upload";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";

interface ChainOption {
  id: string;
  name: string;
  chainId: number;
  imageUri: string | null;
}

interface ChainsApiResponse {
  success: boolean;
  data: ChainOption[];
}

export default function CreateTokenPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: chainsData,
    isLoading: isChainsLoading,
  } = useQuery<ChainsApiResponse>({
    queryKey: ["chains"],
    queryFn: async () => {
      const response = await axios.get<ChainsApiResponse>("/api/chains");
      return response.data;
    },
  });

  const chains = chainsData?.data ?? [];

  const form = useForm<CreateTokenInput>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      symbol: "",
      name: "",
      chainId: "",
      contractAddress: "",
      decimals: 18,
      explorerTokenUrl: "",
      imageUri: "",
    },
  });

  const uploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file);
      form.setValue("imageUri", url);
      toast.success("Icon uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload icon");
    } finally {
      setIsUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: CreateTokenInput) => {
      const response = await axios.post("/api/tokens", data);
      return response.data as { success: boolean; id: string };
    },
    onSuccess: () => {
      toast.success("Token created successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create token");
    },
  });

  const onSubmit = (data: CreateTokenInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add New Token</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="ETH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ethereum" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chain</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isChainsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isChainsLoading
                                ? "Loading chains..."
                                : "Select a chain"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>
                            {chain.name} (ID: {chain.chainId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="18"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="explorerTokenUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explorer Token URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://etherscan.io/token/0x..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Token Icon</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={uploadIcon}
                      disabled={isUploading}
                    />
                    {form.watch("imageUri") && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                        <img
                          src={form.watch("imageUri")}
                          alt="Token Icon"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>

              <Button type="submit" disabled={mutation.isPending || isUploading}>
                {mutation.isPending ? "Creating..." : "Create Token"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

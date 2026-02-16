"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createApiEndpointSchema,
  CreateApiEndpointInput,
} from "@/src/lib/validators/api-endpoint";
import { uploadImage } from "@/src/lib/upload";
import { z } from "zod";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch"; 
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Globe,
  Server,
  Coins,
  Wallet,
  Plus,
  Trash2,
  Upload,
  X,
  AlertCircle,
  List,
  Code,
  FileJson
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChainRow {
  id: string;
  name: string;
  chainId: number;
  imageUri: string | null;
}

interface TokenRow {
  id: string;
  symbol: string;
  name: string | null;
  imageUri: string | null;
  chainId: string;
  decimals: number;
  chainName: string | null;
}

interface WalletRow {
  id: string;
  address: string;
  createdAt: string;
}

const STEPS = [
  {
    title: "Basic Info",
    icon: Globe,
    description: "General details",
  },
  {
    title: "Endpoint Details",
    icon: Server,
    description: "Provider URL & Response",
  },
  {
    title: "Headers",
    icon: List,
    description: "Upstream headers",
  },
  {
    title: "Query Params",
    icon: Code,
    description: "Query parameters",
  },
  {
    title: "Request Body",
    icon: FileJson,
    description: "Body fields",
  },
  {
    title: "Pricing",
    icon: Coins,
    description: "Chain & Cost",
  },
  {
    title: "Wallet & Review",
    icon: Wallet,
    description: "Finalize",
  },
];

const CATEGORIES = [
  "AI & Machine Learning",
  "Finance & Banking",
  "Blockchain & Crypto",
  "Data & Analytics",
  "Communication",
  "Social Media",
  "Weather",
  "Maps & Location",
  "E-Commerce",
  "Healthcare",
  "Other",
];

// Extend schema for form usage to include virtual fields
const formSchema = createApiEndpointSchema.extend({
  chainId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateApiEndpointPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ─── Form Setup ────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      description: "",
      category: "",
      imageUrl: "",
      docsUrl: "",
      providerUrl: "",
      gatewayPath: "", // Optional now
      sampleResponse: "",
      chainId: "", 
      tokenId: "",
      priceAmount: "",
      walletId: "",
      upstreamHeaders: [],
      queryParams: [],
      requestBody: [],
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  // Cleanup abandoned image on unmount if not submitted
  useEffect(() => {
    return () => {
        if (imagePublicId && !isSubmitted) {
            // Attempt delete (fire and forget)
            axios.delete(`/api/upload?public_id=${imagePublicId}`).catch(err => console.error("Cleanup failed", err));
        }
    };
  }, [imagePublicId, isSubmitted]);

  // Field Arrays
  const headersFields = useFieldArray({ control, name: "upstreamHeaders" });
  const paramsFields = useFieldArray({ control, name: "queryParams" });
  const bodyFields = useFieldArray({ control, name: "requestBody" });

  // Watch values for UI logic
  const watchedChainId = watch("chainId");
  const watchedTokenId = watch("tokenId");
  const watchedImageUrl = watch("imageUrl");

  // ─── Data queries ──────────────────────────────────────────────────────
  // ─── Data queries ──────────────────────────────────────────────────────
  const chainsQuery = useQuery<{ success: boolean; data: ChainRow[] }>({
    queryKey: ["chains"],
    queryFn: async () => {
      const res = await axios.get("/api/chains");
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const tokensQuery = useQuery<{ success: boolean; data: TokenRow[] }>({
    queryKey: ["tokens"],
    queryFn: async () => {
      const res = await axios.get("/api/tokens");
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const walletsQuery = useQuery<{ success: boolean; data: WalletRow[] }>({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axios.get("/api/wallets");
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const chainsList = chainsQuery.data?.data ?? [];
  const allTokens = tokensQuery.data?.data ?? [];
  const walletsList = walletsQuery.data?.data ?? [];

  // Filter tokens by selected chain
  const filteredTokens = watchedChainId
    ? allTokens.filter((t) => t.chainId === watchedChainId)
    : [];

  const selectedToken = allTokens.find((t) => t.id === watchedTokenId);
  const selectedChain = chainsList.find((c) => c.id === watchedChainId);
  const selectedWallet = walletsList.find((w) => w.id === watch("walletId"));

  // ─── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: CreateApiEndpointInput) => {
      const res = await axios.post("/api/api-endpoints", data);
      return res.data as { success: boolean; id: string };
    },
    onSuccess: () => {
      setIsSubmitted(true); // Prevent cleanup
      toast.success("API endpoint registered successfully!");
      router.push("/api-endpoints");
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to register API endpoint");
      }
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePublicId) {
       await handleImageDelete();
    }

    setIsUploading(true);
    try {
      const { url, publicId } = await uploadImage(file);
      setValue("imageUrl", url, { shouldValidate: true });
      setImagePublicId(publicId);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleImageDelete = async () => {
    if (!imagePublicId) {
      setValue("imageUrl", "");
      return;
    }

    try {
      await axios.delete(`/api/upload?public_id=${imagePublicId}`);
      setValue("imageUrl", "", { shouldValidate: true });
      setImagePublicId(null);
      toast.success("Image removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete image");
    }
  };

  const validateStep = async (step: number) => {
    let fieldsToValidate: any[] = [];
    switch (step) {
      case 0: // Basic Info
        fieldsToValidate = ["description", "category", "docsUrl"]; // Image optional
        break;
      case 1: // Endpoint Details
        fieldsToValidate = ["providerUrl", "sampleResponse"];
        break;
      case 2: // Headers
        fieldsToValidate = ["upstreamHeaders"];
        break;
      case 3: // Query Params
        fieldsToValidate = ["queryParams"];
        break;
      case 4: // Request Body
        fieldsToValidate = ["requestBody"];
        break;
      case 5: // Pricing
        fieldsToValidate = ["tokenId", "priceAmount"];
        break;
      case 6: // Wallet
        fieldsToValidate = ["walletId"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    
    // Extra manual checks
    if (step === 5 && !watchedChainId) {
        toast.error("Please select a chain");
        return false;
    }

    if (!result) {
        toast.error("Please fill in all required fields before proceeding.");
    }

    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0); 
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const onSubmit = async () => {
      // Validate current step (Wallet) before submmitting
      const isValid = await validateStep(currentStep);
      if (!isValid) return;

      handleSubmit((data) => {
            // Convert price to wei based on token decimals
            const token = allTokens.find(t => t.id === data.tokenId);
            let finalPrice = data.priceAmount;
            if (token) {
                try {
                    finalPrice = parseUnits(data.priceAmount, token.decimals).toString();
                } catch (e) {
                    toast.error("Invalid price format");
                    return;
                }
            }
            createMutation.mutate({ ...data, priceAmount: finalPrice });
      }, (errors) => {
          console.error("Validation errors:", errors);
          const errorFields = Object.keys(errors);
          if (errorFields.length > 0) {
              toast.error(`Please fix errors in: ${errorFields.join(", ")}`);
          } else {
            toast.error("Please check the form for errors.");
          }
      })();
  };

  // ─── Render Steps ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what your API does..."
                            {...form.register("description")}
                            rows={4}
                            className="resize-none"
                        />
                        {errors.description && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.description.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                        <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                    {cat}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="docsUrl">Documentation URL <span className="text-destructive">*</span></Label>
                        <Input
                            id="docsUrl"
                            placeholder="https://docs.example.com"
                            {...form.register("docsUrl")}
                        />
                        {errors.docsUrl && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.docsUrl.message}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>API Image (Optional)</Label>
                    {watchedImageUrl ? (
                        <div className="relative group w-full h-64 rounded-md overflow-hidden border border-input shadow-sm bg-muted/20">
                            <img
                                src={watchedImageUrl}
                                alt="API Preview"
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleImageDelete}
                                >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Image
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full">
                        <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                            ) : (
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            )}
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                SVG, PNG, JPG or GIF (MAX. 2MB)
                            </p>
                            </div>
                            <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            />
                        </label>
                        </div>
                    )}
                </div>
            </div>
          </div>
        );

      case 1: // Endpoint Details
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Endpoint Details</h2>
            <div className="max-w-2xl space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="providerUrl">
                    Provider URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                    id="providerUrl"
                    placeholder="https://api.example.com/v1/data"
                    {...form.register("providerUrl")}
                    className={errors.providerUrl ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.providerUrl && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.providerUrl.message}
                    </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                    The upstream URL your API proxies to
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sampleResponse">Sample Response <span className="text-destructive">*</span></Label>
                    <Textarea
                    id="sampleResponse"
                    placeholder='{"data": [...]}'
                    {...form.register("sampleResponse")}
                    rows={8}
                    className="font-mono text-sm resize-none"
                    />
                     {errors.sampleResponse && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.sampleResponse.message}
                    </p>
                    )}
                </div>
            </div>
          </div>
        );

      case 2: // Headers
        return (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Upstream Headers</h2>
                        <p className="text-sm text-muted-foreground">Optional: Key-value pairs forwarded to your upstream API.</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => headersFields.append({ headerName: "", headerValue: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Header
                    </Button>
                </div>

                <div className="space-y-4 max-w-3xl">
                     {headersFields.fields.length === 0 && (
                        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            No headers configured. Click "Add Header" to start.
                        </div>
                     )}
                     {headersFields.fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Header Name (e.g. X-API-Key)"
                                        {...form.register(`upstreamHeaders.${index}.headerName` as const)}
                                    />
                                    {errors.upstreamHeaders?.[index]?.headerName && (
                                         <p className="text-xs text-destructive">{errors.upstreamHeaders[index]?.headerName?.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Header Value"
                                        {...form.register(`upstreamHeaders.${index}.headerValue` as const)}
                                    />
                                     {errors.upstreamHeaders?.[index]?.headerValue && (
                                         <p className="text-xs text-destructive">{errors.upstreamHeaders[index]?.headerValue?.message}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => headersFields.remove(index)}
                                className="mt-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                </div>
            </div>
        );

      case 3: // Query Params
         return (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Query Parameters</h2>
                        <p className="text-sm text-muted-foreground">Optional: Define parameters users can pass in the URL.</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => paramsFields.append({ name: "", type: "string", required: false, description: "", defaultValue: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parameter
                    </Button>
                </div>

                <div className="space-y-4 max-w-3xl">
                    {paramsFields.fields.length === 0 && (
                        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            No parameters configured. Click "Add Parameter" to start.
                        </div>
                     )}
                    {paramsFields.fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md space-y-4 relative bg-card/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => paramsFields.remove(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="Param Name"
                                    {...form.register(`queryParams.${index}.name` as const)}
                                />
                                {errors.queryParams?.[index]?.name && (
                                         <p className="text-xs text-destructive">{errors.queryParams[index]?.name?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                                <Select
                                    onValueChange={(val) => setValue(`queryParams.${index}.type`, val)}
                                    defaultValue={field.type}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="string">String</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller
                                control={control}
                                name={`queryParams.${index}.required`}
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label>Required</Label>
                        </div>
                        <Input
                            placeholder="Description"
                            {...form.register(`queryParams.${index}.description` as const)}
                        />
                        <Input
                            placeholder="Default Value (Optional)"
                            {...form.register(`queryParams.${index}.defaultValue` as const)}
                        />
                    </div>
                    ))}
                </div>
            </div>
         );

      case 4: // Request Body
         return (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Request Body</h2>
                        <p className="text-sm text-muted-foreground">Optional: Define the structure of the JSON body.</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bodyFields.append({ fieldName: "", fieldType: "string", required: false, description: "", exampleValue: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field
                    </Button>
                </div>

                <div className="space-y-4 max-w-3xl">
                     {bodyFields.fields.length === 0 && (
                        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            No body fields configured. Click "Add Field" to start.
                        </div>
                     )}
                    {bodyFields.fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md space-y-4 relative bg-card/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => bodyFields.remove(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Field Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="Field Name"
                                    {...form.register(`requestBody.${index}.fieldName` as const)}
                                />
                                {errors.requestBody?.[index]?.fieldName && (
                                         <p className="text-xs text-destructive">{errors.requestBody[index]?.fieldName?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                                <Select
                                    onValueChange={(val) => setValue(`requestBody.${index}.fieldType`, val)}
                                    defaultValue={field.fieldType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="string">String</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                        <SelectItem value="object">Object</SelectItem>
                                        <SelectItem value="array">Array</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller
                                control={control}
                                name={`requestBody.${index}.required`}
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label>Required</Label>
                        </div>
                        <Input
                            placeholder="Description"
                            {...form.register(`requestBody.${index}.description` as const)}
                        />
                        <Input
                            placeholder="Example Value (Optional)"
                            {...form.register(`requestBody.${index}.exampleValue` as const)}
                        />
                    </div>
                    ))}
                </div>
            </div>
         );
      case 5: // Pricing
        if (chainsQuery.isLoading || tokensQuery.isLoading) {
             return (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Loading pricing options...</p>
                </div>
             );
        }

        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
             <h2 className="text-xl font-semibold mb-4 text-foreground">Usage Pricing</h2>
             <div className="max-w-xl space-y-6">
                <div className="space-y-2">
                <Label>
                    Chain <span className="text-destructive">*</span>
                </Label>
                <Controller
                    control={control}
                    name="chainId" // Virtual
                    render={({ field }) => (
                    <Select
                        value={field.value || ""} // Ensure controlled value
                        onValueChange={(val) => {
                            field.onChange(val);
                            setValue("tokenId", ""); // Reset token
                        }}
                    >
                        <SelectTrigger className={!watchedChainId && isSubmitted ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a chain" />
                        </SelectTrigger>
                        <SelectContent>
                            {chainsList.map((chain) => (
                            <SelectItem key={chain.id} value={chain.id}>
                                <div className="flex items-center gap-2">
                                {chain.imageUri && (
                                    <img
                                    src={chain.imageUri}
                                    alt={chain.name}
                                    className="w-4 h-4 rounded-full"
                                    />
                                )}
                                {chain.name}
                                </div>
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                </div>
                {watchedChainId && (
                <div className="space-y-2">
                    <Label>
                    Token <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                        control={control}
                        name="tokenId"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger className={errors.tokenId ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select a token" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTokens.map((token) => (
                                        <SelectItem key={token.id} value={token.id}>
                                            <div className="flex items-center gap-2">
                                                {token.imageUri && (
                                                    <img src={token.imageUri} alt={token.symbol} className="w-4 h-4 rounded-full" />
                                                )}
                                                {token.symbol}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.tokenId && <p className="text-xs text-destructive">{errors.tokenId.message}</p>}
                </div>
                )}
                
                {watchedTokenId && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="priceAmount">
                            Price per call <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="priceAmount"
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.0001"
                            {...form.register("priceAmount")}
                            className={errors.priceAmount ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors.priceAmount && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.priceAmount.message}
                            </p>
                        )}
                        {selectedToken && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Token: {selectedToken.symbol} (Decimals: {selectedToken.decimals})</p>
                                {form.watch("priceAmount") && !isNaN(Number(form.watch("priceAmount"))) && (
                                    <p className="font-mono text-primary">
                                        Equivalent to {parseUnits(form.watch("priceAmount"), selectedToken.decimals).toString()} Wei
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>
        );

      case 6: // Wallet & Review
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Review & Connect Wallet</h2>
            
            <div className="max-w-xl space-y-6">
                <div className="space-y-2">
                <Label>
                    Receiving Wallet <span className="text-destructive">*</span>
                </Label>
                <Controller
                    control={control}
                    name="walletId"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.walletId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a wallet" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] w-[var(--radix-select-trigger-width)]">
                        {walletsList.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex flex-col items-start gap-1 max-w-full overflow-hidden">
                                <span className="font-mono text-sm truncate w-full block">
                                {wallet.address}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                Added: {new Date(wallet.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                 {errors.walletId && <p className="text-xs text-destructive">{errors.walletId.message}</p>}
                </div>
                
                <div className="bg-muted/50 p-6 rounded-lg border space-y-4">
                    <h3 className="font-semibold text-lg">Summary</h3>
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Name/Description:</span>
                            <span className="text-right truncate max-w-[200px]">{form.getValues("description").slice(0, 30)}...</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider URL:</span>
                            <span className="font-mono truncate max-w-[200px]">{form.getValues("providerUrl")}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span>{form.getValues("category")}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span>{form.getValues("priceAmount")} ({selectedToken?.symbol})</span>
                         </div>
                         <Separator className="my-2"/>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Upstream Headers:</span>
                            <Badge variant="secondary">{headersFields.fields.length} configured</Badge>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Query Params:</span>
                            <Badge variant="secondary">{paramsFields.fields.length} configured</Badge>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Body Fields:</span>
                            <Badge variant="secondary">{bodyFields.fields.length} configured</Badge>
                         </div>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-primary" />
                    <p>
                        By creating this endpoint, you confirm that you own the rights to the data and agree to our terms of service.
                    </p>
                </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* ─── Fixed Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-muted/10 md:h-screen md:sticky md:top-0 overflow-y-auto z-10">
        <div className="p-6 md:p-8">
            <Link href="/api-endpoints" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Endpoints
            </Link>
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Create Endpoint</h1>
                <p className="text-sm text-muted-foreground">
                    Register a new API endpoint to start monetizing your data.
                </p>
            </div>

            <nav className="space-y-2">
                {STEPS.map((step, i) => {
                    const isActive = i === currentStep;
                    const isCompleted = completedSteps.includes(i); 

                    return (
                        <button
                            key={i}
                            onClick={() => {
                                // Only allow clicking if step is completed or it's the current one
                                if (isCompleted || isActive) {
                                     setCurrentStep(i);
                                }
                            }}
                            className={`w-full flex items-start p-3 rounded-lg transition-all duration-200 text-left group
                                ${isActive ? "bg-primary/10 border-primary/20 ring-1 ring-primary/20" : "hover:bg-muted/50"}
                                ${!isCompleted && !isActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                            disabled={!isCompleted && !isActive}
                        >
                            <div className={`
                                mt-0.5 mr-3 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                ${isCompleted ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                            `}>
                                {isCompleted ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                            </div>
                            <div>
                                <h3 className={`font-medium text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{step.title}</h3>
                                <p className="text-xs text-muted-foreground leading-tight">{step.description}</p>
                            </div>
                        </button>
                    );
                })}
            </nav>
        </div>
      </div>

      {/* ─── Scrollable Content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
         <div className="flex-1 w-full max-w-5xl mx-auto py-10 px-6 md:px-12">
            {/* Step Content */}
            {renderStep()}
        </div>

         {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t p-6 md:px-12 flex justify-between items-center z-20">
            <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
            >
                Start Over
            </Button>
            
            <div className="flex gap-4">
                {currentStep > 0 && (
                     <Button variant="ghost" onClick={handleBack}>
                        Back
                    </Button>
                )}
                
                {currentStep === STEPS.length - 1 ? (
                    <Button onClick={onSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Endpoint"
                        )}
                    </Button>
                ) : (
                    <Button onClick={handleNext}>
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseUnits(value: string, decimals: number): bigint {
    if (!value) return BigInt(0);
    // Remove commas
    let [integer, fraction = ""] = value.replace(/,/g, "").split(".");
    
    // Truncate fraction to decimals
    if (fraction.length > decimals) {
        fraction = fraction.slice(0, decimals);
    }
    
    // Pad fraction
    fraction = fraction.padEnd(decimals, "0");
    
    return BigInt(integer + fraction);
}

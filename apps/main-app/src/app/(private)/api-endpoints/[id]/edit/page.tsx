"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createApiEndpointSchema,
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Check,
  Plus,
  Trash2,
  Upload,
  X,
  AlertCircle,
  Save,
  ChevronLeft,
  List,
  Code,
  FileJson,
  Server
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Switch } from "@/src/components/ui/switch";
import { Separator } from "@/src/components/ui/separator";


// ─── Types ───────────────────────────────────────────────────────────────────

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

// Re-use or simplify the schema for editing
const editSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  docsUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  upstreamHeaders: z.array(z.object({
    headerName: z.string().min(1, "Header name is required"),
    headerValue: z.string().min(1, "Header value is required"),
  })).optional(),
  queryParams: z.array(z.object({
    name: z.string().min(1, "Param name is required"),
    type: z.string().min(1, "Type is required"),
    required: z.boolean().default(false),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
  })).optional(),
  requestBody: z.array(z.object({
    fieldName: z.string().min(1, "Field name is required"),
    fieldType: z.string().min(1, "Field type is required"),
    required: z.boolean().default(false),
    description: z.string().optional(),
    exampleValue: z.string().optional(),
  })).optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditApiEndpointPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      description: "",
      category: "",
      imageUrl: "",
      docsUrl: "",
      tags: [],
      upstreamHeaders: [],
      queryParams: [],
      requestBody: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({
    control,
    name: "upstreamHeaders",
  });

  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({
    control,
    name: "queryParams",
  });

  const { fields: bodyFields, append: appendBody, remove: removeBody } = useFieldArray({
    control,
    name: "requestBody",
  });

  const watchedImageUrl = watch("imageUrl");

  // ─── Data queries ──────────────────────────────────────────────────────
  const { data: endpointData, isLoading: isLoadingEndpoint } = useQuery({
    queryKey: ["api-endpoint", id],
    queryFn: async () => {
      const res = await axios.get(`/api/api-endpoints/${id}`);
      return res.data.data;
    },
  });

  // Pre-populate form when data arrives
  useEffect(() => {
    if (endpointData) {
      reset({
        description: endpointData.description || "",
        category: endpointData.category || "",
        imageUrl: endpointData.imageUrl || "",
        docsUrl: endpointData.docsUrl || "",
        tags: endpointData.tags || [],
        upstreamHeaders: endpointData.apiUpstreamHeaders?.map((h: any) => ({
          headerName: h.headerName,
          headerValue: h.headerValue,
        })) || [],
        queryParams: endpointData.apiQueryParams?.map((p: any) => ({
          name: p.name,
          type: p.type,
          required: p.required,
          description: p.description || "",
          defaultValue: p.defaultValue || "",
        })) || [],
        requestBody: endpointData.apiRequestBodies?.map((b: any) => ({
          fieldName: b.fieldName,
          fieldType: b.fieldType,
          required: b.required,
          description: b.description || "",
          exampleValue: b.exampleValue || "",
        })) || [],
      });
    }
  }, [endpointData, reset]);

  // ─── Mutations ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const res = await axios.patch(`/api/api-endpoints/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-endpoint", id] });
      queryClient.invalidateQueries({ queryKey: ["my-endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("API Endpoint updated successfully");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update API endpoint";
      toast.error(message);
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadImage(file);
      // Use any for the response since uploadImage might return different structures
      const imageUrl = (res as any).secure_url || (res as any).url;
      if (imageUrl) {
        setValue("imageUrl", imageUrl, { shouldValidate: true });
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = () => {
    setValue("imageUrl", "", { shouldValidate: true });
  };

  const onUpdateSubmit = (data: EditFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoadingEndpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
            <Link 
                href="/dashboard" 
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group"
            >
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Edit API Endpoint</h1>
            <p className="text-muted-foreground">Manage tags and basic information for your listed API.</p>
        </div>

        <form onSubmit={handleSubmit(onUpdateSubmit)} className="space-y-8">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8 rounded-2xl p-1 bg-muted/50 backdrop-blur-sm h-14">
                    <TabsTrigger value="basic" className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Basic Info</TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Technical Specs</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-8 animate-in fade-in duration-500">
                    <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Update the public identity of your API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe what your API does..."
                                            {...form.register("description")}
                                            rows={4}
                                            className="resize-none rounded-2xl"
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
                                                <SelectTrigger className="rounded-2xl">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
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
                                            className="rounded-2xl"
                                        />
                                        {errors.docsUrl && (
                                            <p className="text-xs text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {errors.docsUrl.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label>API Image (Optional)</Label>
                                    {watchedImageUrl ? (
                                        <div className="relative group w-full h-64 rounded-[2rem] overflow-hidden border border-input shadow-sm bg-muted/20">
                                            <img
                                                src={watchedImageUrl}
                                                alt="API Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleImageDelete}
                                                    className="rounded-xl"
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
                                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[2rem] cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {isUploading ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                                ) : (
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                )}
                                                <p className="mb-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold">Click to upload</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    MAX. 2MB
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

                            <Separator className="my-8" />

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="tags" className="text-lg font-bold">Manage Tags</Label>
                                    <p className="text-xs text-muted-foreground">Add or remove tags to improve searchability.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="tags"
                                        placeholder="Add a tag and press Enter..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        className="rounded-2xl"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const tag = tagInput.trim();
                                                if (tag) {
                                                    const currentTags = form.getValues("tags") || [];
                                                    if (!currentTags.includes(tag)) {
                                                        form.setValue("tags", [...currentTags, tag]);
                                                    }
                                                    setTagInput("");
                                                }
                                            }
                                        }}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon"
                                        className="rounded-2xl h-10 w-10 shrink-0"
                                        onClick={() => {
                                            const tag = tagInput.trim();
                                            if (tag) {
                                                const currentTags = form.getValues("tags") || [];
                                                if (!currentTags.includes(tag)) {
                                                    form.setValue("tags", [...currentTags, tag]);
                                                }
                                                setTagInput("");
                                            }
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {form.watch("tags")?.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-bold transition-all hover:bg-primary/20 rounded-xl">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentTags = form.getValues("tags") || [];
                                                    form.setValue("tags", currentTags.filter((t) => t !== tag));
                                                }}
                                                className="hover:text-destructive transition-colors ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {(!form.watch("tags") || form.watch("tags")?.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic">No tags added yet.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="specs" className="space-y-8 animate-in fade-in duration-500">
                    {/* Headers */}
                    <Card className="rounded-[2.5rem] border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <List className="h-5 w-5 text-primary" /> Upstream Headers
                                </CardTitle>
                                <CardDescription>Headers forwarded to your provider.</CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => appendHeader({ headerName: "", headerValue: "" })}
                                className="rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Header
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {headerFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-3xl bg-muted/30 border border-border/50 relative group">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            {...form.register(`upstreamHeaders.${index}.headerName`)}
                                            placeholder="X-API-Key"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Value</Label>
                                        <Input
                                            {...form.register(`upstreamHeaders.${index}.headerValue`)}
                                            placeholder="your-secret-key"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeHeader(index)}
                                        className="absolute -top-2 -right-2 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {headerFields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-3xl">
                                    No headers defined.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Query Params */}
                    <Card className="rounded-[2.5rem] border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5 text-primary" /> Query Parameters
                                </CardTitle>
                                <CardDescription>Parameters for data search and filtering.</CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => appendParam({ name: "", type: "string", required: false, description: "", defaultValue: "" })}
                                className="rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Param
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paramFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-[2rem] bg-muted/30 border border-border/50 relative group">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input {...form.register(`queryParams.${index}.name`)} placeholder="limit" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Controller
                                            control={control}
                                            name={`queryParams.${index}.type`}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="string">String</SelectItem>
                                                        <SelectItem value="number">Number</SelectItem>
                                                        <SelectItem value="boolean">Boolean</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 group-pt-6">
                                        <Controller
                                            control={control}
                                            name={`queryParams.${index}.required`}
                                            render={({ field }) => (
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            )}
                                        />
                                        <Label>Required</Label>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Description</Label>
                                        <Input {...form.register(`queryParams.${index}.description`)} placeholder="Maximum number of results to return" className="rounded-xl" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeParam(index)}
                                        className="absolute -top-2 -right-2 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {paramFields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-3xl">
                                    No query parameters defined.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Request Body */}
                    <Card className="rounded-[2.5rem] border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileJson className="h-5 w-5 text-primary" /> Request Body Fields
                                </CardTitle>
                                <CardDescription>JSON fields for POST/PUT requests.</CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => appendBody({ fieldName: "", fieldType: "string", required: false, description: "", exampleValue: "" })}
                                className="rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Field
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {bodyFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-[2rem] bg-muted/30 border border-border/50 relative group">
                                    <div className="space-y-2">
                                        <Label>Field Name</Label>
                                        <Input {...form.register(`requestBody.${index}.fieldName`)} placeholder="user_id" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Field Type</Label>
                                        <Controller
                                            control={control}
                                            name={`requestBody.${index}.fieldType`}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="string">String</SelectItem>
                                                        <SelectItem value="number">Number</SelectItem>
                                                        <SelectItem value="boolean">Boolean</SelectItem>
                                                        <SelectItem value="object">Object</SelectItem>
                                                        <SelectItem value="array">Array</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 group-pt-6">
                                        <Controller
                                            control={control}
                                            name={`requestBody.${index}.required`}
                                            render={({ field }) => (
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            )}
                                        />
                                        <Label>Required</Label>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Description</Label>
                                        <Input {...form.register(`requestBody.${index}.description`)} placeholder="Unique identifier of the user" className="rounded-xl" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeBody(index)}
                                        className="absolute -top-2 -right-2 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {bodyFields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-3xl">
                                    No body fields defined.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-8">
                <Link href="/dashboard">
                    <Button type="button" variant="ghost" className="rounded-2xl h-12 px-8">Cancel</Button>
                </Link>
                <Button 
                    type="submit" 
                    className="rounded-2xl px-12 h-12 text-lg font-bold shadow-xl shadow-primary/20"
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
}

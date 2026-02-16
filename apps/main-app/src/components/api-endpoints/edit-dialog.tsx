"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateApiEndpointSchema,
  UpdateApiEndpointInput,
} from "@/src/lib/validators/api-endpoint";
import { uploadImage } from "@/src/lib/upload";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Switch } from "@/src/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, X, Upload, Trash2 } from "lucide-react";

interface EditDialogProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

interface TokenRow {
  id: string;
  symbol: string;
}

interface WalletRow {
  id: string;
  address: string;
}

export function EditApiEndpointDialog({ id, open, onOpenChange }: EditDialogProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);

  // ─── Query Data ────────────────────────────────────────────────────────
  const { data: endpointData, isLoading: isLoadingEndpoint } = useQuery({
    queryKey: ["api-endpoint", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`/api/api-endpoints/${id}`);
      return res.data.data;
    },
    enabled: !!id && open,
  });

  const { data: tokensData } = useQuery<{ data: TokenRow[] }>({
    queryKey: ["tokens"],
    queryFn: async () => {
      const res = await axios.get<{ data: TokenRow[] }>("/api/tokens");
      return res.data;
    },
    enabled: open,
  });

  const { data: walletsData } = useQuery<{ data: WalletRow[] }>({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axios.get<{ data: WalletRow[] }>("/api/wallets");
      return res.data;
    },
    enabled: open,
  });

  const tokensList = tokensData?.data ?? [];
  const walletsList = walletsData?.data ?? [];

  // ─── Form ──────────────────────────────────────────────────────────────
  const form = useForm<UpdateApiEndpointInput>({
    resolver: zodResolver(updateApiEndpointSchema) as any,
    defaultValues: {
      description: "",
      category: "",
      imageUrl: "",
      docsUrl: "",
      providerUrl: "",
      gatewayPath: "",
      sampleResponse: "",
      tokenId: "",
      priceAmount: "",
      walletId: "",
      isActive: true,
      upstreamHeaders: [],
      queryParams: [],
      requestBody: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Field Arrays
  const headersFields = useFieldArray({ control, name: "upstreamHeaders" });
  const paramsFields = useFieldArray({ control, name: "queryParams" });
  const bodyFields = useFieldArray({ control, name: "requestBody" });

  const watchedImageUrl = watch("imageUrl");

  // Reset form when data loads
  useEffect(() => {
    if (endpointData) {
      reset({
        description: endpointData.description ?? "",
        category: endpointData.category ?? "",
        imageUrl: endpointData.imageUrl ?? "",
        docsUrl: endpointData.docsUrl ?? "",
        providerUrl: endpointData.providerUrl,
        gatewayPath: endpointData.gatewayPath,
        sampleResponse: endpointData.sampleResponse ?? "",
        tokenId: endpointData.tokenId,
        priceAmount: endpointData.priceAmount,
        walletId: endpointData.walletId,
        isActive: endpointData.isActive,
        upstreamHeaders: endpointData.upstreamHeaders ?? [],
        queryParams: endpointData.queryParams ?? [],
        requestBody: endpointData.requestBody ?? [],
      });
      // Reset publicId state since we don't know it for existing images
      setImagePublicId(null); 
    }
  }, [endpointData, reset]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const extractPublicIdFromUrl = (url: string): string | null => {
    // Attempt to extract public_id from Cloudinary URL
    // Pattern: .../upload/v<version>/<folder>/<public_id>.<ext>
    // Or: .../upload/<folder>/<public_id>.<ext>
    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;
        
        // Everything after upload/ (and optional version)
        let relevantParts = parts.slice(uploadIndex + 1);
        if (relevantParts[0]?.startsWith("v")) {
            relevantParts = relevantParts.slice(1);
        }
        
        const filename = relevantParts.join("/");
        // Remove extension
        const lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex === -1) return filename;
        return filename.substring(0, lastDotIndex);
    } catch (e) {
        return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If there is an existing image, try to delete it
    if (watchedImageUrl) {
        let publicIdToDelete = imagePublicId;
        if (!publicIdToDelete) {
             publicIdToDelete = extractPublicIdFromUrl(watchedImageUrl);
        }
        
        if (publicIdToDelete) {
             try {
                await axios.delete(`/api/upload?public_id=${publicIdToDelete}`);
             } catch (err) {
                 console.warn("Failed to delete old image", err);
             }
        }
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
    if (watchedImageUrl) {
         let publicIdToDelete = imagePublicId;
         if (!publicIdToDelete) {
             publicIdToDelete = extractPublicIdFromUrl(watchedImageUrl);
         }

         if (publicIdToDelete) {
             try {
                await axios.delete(`/api/upload?public_id=${publicIdToDelete}`);
                toast.success("Old image deleted from cloud");
             } catch (err) {
                 console.warn("Failed to delete old image", err);
                 // Proceed anyway to clear form
             }
         }
    }
    setValue("imageUrl", "", { shouldValidate: true });
    setImagePublicId(null);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateApiEndpointInput) => {
      if (!id) throw new Error("No ID");
      const res = await axios.put(`/api/api-endpoints/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("API Endpoint updated");
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["api-endpoint", id] });
      onOpenChange(false);
    },
    onError: (error) => {
        console.error(error);
        toast.error("Failed to update API endpoint");
    },
  });

  const onSubmit = (data: UpdateApiEndpointInput) => {
    updateMutation.mutate(data);
  };

  // ─── Render ────────────────────────────────────────────────────────────
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit API Endpoint</DialogTitle>
          <DialogDescription>
            Update your API configuration.
          </DialogDescription>
        </DialogHeader>

        {isLoadingEndpoint ? (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
             <div className="space-y-6 py-4">
                 {/* Basic Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...form.register("description")} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                         <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                         />
                      </div>
                      <div className="col-span-full space-y-2">
                          <Label>Image</Label>
                           <div className="flex items-center gap-4">
                               {watchedImageUrl && (
                                   <div className="relative w-20 h-20 rounded border overflow-hidden">
                                       <img src={watchedImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                   </div>
                               )}
                               <div className="flex-1">
                                    <Label htmlFor="edit-image-upload" className="cursor-pointer inline-flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
                                        <Upload className="h-4 w-4" />
                                        {watchedImageUrl ? "Replace Image" : "Upload Image"}
                                    </Label>
                                    <Input id="edit-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    {isUploading && <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />}
                                    {watchedImageUrl && (
                                        <Button variant="ghost" size="sm" onClick={handleImageDelete} className="ml-2 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    )}
                               </div>
                           </div>
                      </div>
                 </div>

                 {/* Config */}
                 <div className="space-y-4 border rounded-md p-4">
                     <h3 className="font-medium text-sm">Configuration</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Provider URL</Label>
                            <Input {...form.register("providerUrl")} />
                         </div>
                         <div className="space-y-2">
                            <Label>Gateway Path</Label>
                            <Input {...form.register("gatewayPath")} />
                         </div>
                     </div>
                     <div className="space-y-2">
                        <Label>Sample Response</Label>
                        <Textarea {...form.register("sampleResponse")} className="font-mono text-xs" rows={4} />
                     </div>
                     
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="headers">
                            <AccordionTrigger>Upstream Headers</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                     {headersFields.fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2">
                                            <Input placeholder="Name" {...form.register(`upstreamHeaders.${index}.headerName`)} />
                                            <Input placeholder="Value" {...form.register(`upstreamHeaders.${index}.headerValue`)} />
                                            <Button variant="ghost" size="icon" onClick={() => headersFields.remove(index)}><X className="h-4 w-4" /></Button>
                                        </div>
                                     ))}
                                     <Button variant="outline" size="sm" type="button" onClick={() => headersFields.append({ headerName: "", headerValue: "" })}>Add Header</Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="params">
                            <AccordionTrigger>Query Parameters</AccordionTrigger>
                             <AccordionContent>
                                <div className="space-y-4">
                                     {paramsFields.fields.map((field, index) => (
                                         <div key={field.id} className="border p-2 rounded relative space-y-2">
                                             <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => paramsFields.remove(index)}><X className="h-3 w-3" /></Button>
                                             <div className="grid grid-cols-2 gap-2">
                                                 <Input placeholder="Name" {...form.register(`queryParams.${index}.name`)} />
                                                  <Controller control={control} name={`queryParams.${index}.type`} render={({ field }) => (
                                                      <Select onValueChange={field.onChange} value={field.value}>
                                                          <SelectTrigger className="h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                                                          <SelectContent>
                                                              <SelectItem value="string">String</SelectItem>
                                                              <SelectItem value="number">Number</SelectItem>
                                                              <SelectItem value="boolean">Boolean</SelectItem>
                                                          </SelectContent>
                                                      </Select>
                                                  )} />
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <Controller control={control} name={`queryParams.${index}.required`} render={({field}) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                                                 <Label className="text-xs">Required</Label>
                                             </div>
                                             <Input placeholder="Description" {...form.register(`queryParams.${index}.description`)} className="h-8 text-xs" />
                                         </div>
                                     ))}
                                     <Button variant="outline" size="sm" type="button" onClick={() => paramsFields.append({ name: "", type: "string", required: false })}>Add Param</Button>
                                </div>
                             </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="body">
                             <AccordionTrigger>Request Body</AccordionTrigger>
                             <AccordionContent>
                                  <div className="space-y-4">
                                     {bodyFields.fields.map((field, index) => (
                                         <div key={field.id} className="border p-2 rounded relative space-y-2">
                                             <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => bodyFields.remove(index)}><X className="h-3 w-3" /></Button>
                                             <div className="grid grid-cols-2 gap-2">
                                                 <Input placeholder="Field Name" {...form.register(`requestBody.${index}.fieldName`)} />
                                                  <Controller control={control} name={`requestBody.${index}.fieldType`} render={({ field }) => (
                                                      <Select onValueChange={field.onChange} value={field.value}>
                                                          <SelectTrigger className="h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                                                          <SelectContent>
                                                              <SelectItem value="string">String</SelectItem>
                                                              <SelectItem value="number">Number</SelectItem>
                                                              <SelectItem value="boolean">Boolean</SelectItem>
                                                              <SelectItem value="object">Object</SelectItem>
                                                              <SelectItem value="array">Array</SelectItem>
                                                          </SelectContent>
                                                      </Select>
                                                  )} />
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <Controller control={control} name={`requestBody.${index}.required`} render={({field}) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                                                 <Label className="text-xs">Required</Label>
                                             </div>
                                              <Input placeholder="Description" {...form.register(`requestBody.${index}.description`)} className="h-8 text-xs" />
                                         </div>
                                     ))}
                                     <Button variant="outline" size="sm" type="button" onClick={() => bodyFields.append({ fieldName: "", fieldType: "string", required: false })}>Add Body Field</Button>
                                </div>
                             </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                 </div>

                 {/* Pricing & Wallet */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label>Token</Label>
                          <Controller control={control} name="tokenId" render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger><SelectValue placeholder="Select Token" /></SelectTrigger>
                                  <SelectContent>
                                      {tokensList.map(t => <SelectItem key={t.id} value={t.id}>{t.symbol}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          )} />
                     </div>
                     <div className="space-y-2">
                         <Label>Price</Label>
                         <Input {...form.register("priceAmount")} />
                     </div>
                      <div className="space-y-2">
                         <Label>Wallet</Label>
                          <Controller control={control} name="walletId" render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger><SelectValue placeholder="Select Wallet" /></SelectTrigger>
                                  <SelectContent>
                                      {walletsList.map(w => <SelectItem key={w.id} value={w.id}>{w.address.slice(0,6)}...{w.address.slice(-4)}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          )} />
                     </div>
                      <div className="space-y-2 flex flex-col justify-end">
                          <div className="flex items-center gap-2 border p-2 rounded-md">
                              <Controller control={control} name="isActive" render={({field}) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                              <Label>Active</Label>
                          </div>
                     </div>
                 </div>

             </div>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending || isLoadingEndpoint}>
                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

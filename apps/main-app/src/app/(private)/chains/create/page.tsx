"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { createChainSchema, type CreateChainInput } from "@/src/lib/validators/chain";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner"; // Assuming sonner is used, or fallback to alert

export default function CreateChainPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CreateChainInput>({
    resolver: zodResolver(createChainSchema),
    defaultValues: {
      name: "",
      chainId: 0,
      explorerBaseUrl: "",
      imageUri: "",
    },
  });

  const uploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
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
    mutationFn: async (data: CreateChainInput) => {
      const response = await axios.post("/api/chains", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Chain created successfully!");
      router.push("/dashboard"); // Redirect to dashboard or chains list
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create chain");
    },
  });

  const onSubmit = (data: CreateChainInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add New Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chain Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ethereum" {...field} />
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
                    <FormLabel>Chain ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
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
                name="explorerBaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explorer Base URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://etherscan.io" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Chain Icon</FormLabel>
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
                          alt="Chain Icon"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                {/* Hidden input to register the field if needed, but we used setValue */}
              </FormItem>

              <Button type="submit" disabled={mutation.isPending || isUploading}>
                {mutation.isPending ? "Creating..." : "Create Chain"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

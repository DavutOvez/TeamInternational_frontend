import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/AuthContext";
import { insertRecipeSchema } from "@shared/schema";
import { Camera, X } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { m } from "framer-motion";

const createRecipeSchema = insertRecipeSchema.extend({
  imageUrl: z.string().optional(),
});
type CreateRecipeForm = z.infer<typeof createRecipeSchema>;

export default function CreateRecipe() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");

  const form = useForm<CreateRecipeForm>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: "",
      description: "",
      cookTime: "",
      servings: "",
      difficulty: "easy",
      ingredients: "",
      instructions: "",
    },
  });



  async function uploadToGitHub(file: File): Promise<string> {
    const repo = "DavutOvez/recipe-images";
    const path = `images/${Date.now()}_${file.name}`;
    const token = import.meta.env.VITE_GITHUB_TOKEN; // GitHub Personal Access Token

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const encoded = result.split(",")[1]; // sadece base64 kısmı
        resolve(encoded);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file); // binary -> base64
    });

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Add recipe image",
        content: base64,
      }),
    });
    if (!res.ok) {
      throw new Error(`GitHub upload failed: ${res.status} ${await res.text()}`);
    }

    return `https://cdn.jsdelivr.net/gh/${repo}/${path}`;
  }

  const createRecipeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/recipes/create/", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create recipe");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Recipe Created!", description: "Your recipe has been published successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setLocation("/");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  const [isUploading, setIsUploading] = useState(false);


  const onSubmit = async (data: CreateRecipeForm) => {
    const token = localStorage.getItem("accessToken");
    let imageUrl = uploadedImageUrl;
    console.log("Submitting recipe:", { data, imageUrl, token });

    try {
      if (uploadedFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadToGitHub(uploadedFile);
        } catch (githubErr) {
          console.error("GitHub upload failed:", githubErr);
          toast({ title: "GitHub Error", description: (githubErr as Error).message, variant: "destructive" });
          imageUrl = "";
        }
        setIsUploading(false);
      }
      if (imageUrl) {
      imageUrl = encodeURI(imageUrl);
    }

      const body = {
        title: data.title,
        description: data.description,
        image_url: uploadedFile ? imageUrl : "", 
        cook_time: data.cookTime || "",          
        servings: data.servings,
        difficulty: selectedDifficulty,
        ingredients: data.ingredients,
        instructions: data.instructions,
      };
      console.log("Sending to backend:", body);

      const res = await fetch("http://192.168.1.113:8000/api/recipes/create/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      console.log("Backend response:", res);

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        toast({ title: "Backend Error", description: text, variant: "destructive" });
        return;
      }

      const json = await res.json();
      console.log("Recipe created successfully:", json);
      toast({ title: "Recipe Created!", description: "Your recipe has been published successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setLocation("/");

    } catch (err) {
      setIsUploading(false);
      console.error("Submit error:", err);
      toast({ title: "Network Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (authLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold">Please Log In</h2>
        <Button onClick={() => (window.location.href = "/api/login")}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <div className="max-w-md mx-auto flex flex-col h-[calc(100vh-140px)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <Button type="button" variant="ghost" onClick={() => setLocation("/")}>
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Create Recipe</h2>
            <Button type="submit" disabled={createRecipeMutation.isPending}>
              {createRecipeMutation.isPending ? "Publishing..." : "Post"}
              {isUploading && <p className="text-sm text-gray-500">Uploading image to GitHub...</p>}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <Card>
              <CardContent className="p-6">
                {uploadedImageUrl ? (
                  <div className="relative">
                    <img src={uploadedImageUrl} alt="Recipe preview" className="w-full h-48 object-cover rounded-xl" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImageUrl("");
                        setUploadedFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setUploadedFile(e.target.files[0]);
                          setUploadedImageUrl(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="mb-4"
                    />
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Add recipe photo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="title">Recipe Name</Label>
              <Input id="title" placeholder="What's cooking?" {...form.register("title")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Tell us about your recipe..." {...form.register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cookTime">Cook Time</Label>
                <Input id="cookTime" placeholder="25 min" {...form.register("cookTime")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input id="servings" placeholder="4" {...form.register("servings")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex space-x-3">
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={selectedDifficulty === level ? "default" : "outline"}
                    onClick={() => setSelectedDifficulty(level as "easy" | "medium" | "hard")}
                    className="flex-1"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea id="ingredients" placeholder="List your ingredients..." {...form.register("ingredients")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" placeholder="Step by step..." {...form.register("instructions")} />
            </div>
          </div>
        </form>
      </div>

      <BottomNav onCreateClick={() => {}} />
    </div>
  );
}
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth, } from "@/hooks/AuthContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Settings, LogOut, Clock, Users } from "lucide-react";
import { useLocation } from "wouter";
import type { RecipeWithCreator } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
  queryKey: ["auth-me"],
  queryFn: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No token");
    const res = await fetch("/api/auth/me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user data");
    return res.json();
  },
});

const {
  data: userRecipes = [],
  isLoading: recipesLoading,
  error: recipesError,
  refetch: refetchRecipes,
} = useQuery<RecipeWithCreator[]>({
  queryKey: ["user-recipes", userData?.username],
  queryFn: async () => {
    if (!userData?.username) throw new Error("No username available");
    const res = await fetch(`/api/${userData.username}/recipes/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch recipes");
    return res.json();
  },
  enabled: !!userData?.username, // userData hazır olduğunda çalışır
});

  const handleCreateClick = () => {
    setLocation("/create");
  };

  const handleLogout = async () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    queryClient.clear();
    window.location.href = "/";
  };

  const handleRecipeClick = (recipeId: string) => {
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (recipesError) {
      console.error("Recipes fetch error:", recipesError);
      if (isUnauthorizedError(recipesError)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    }
  }, [recipesError, toast]);

  if (authLoading || recipesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <div className="max-w-md mx-auto h-[calc(100vh-140px)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <BottomNav onCreateClick={handleCreateClick} />
      </div>
    );
  }
  

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <div className="max-w-md mx-auto h-[calc(100vh-140px)] flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Please Log In</h2>
            <p className="text-gray-600">You need to be logged in to view your profile.</p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Log In
            </Button>
          </div>
        </div>
        <BottomNav onCreateClick={handleCreateClick} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50" data-testid="profile-page">
      <Header />
      
      <div className="max-w-md mx-auto h-[calc(100vh-140px)] overflow-y-auto">
        <div className="bg-white p-6">
          <div className="text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto border-4 border-primary" data-testid="profile-avatar">
              <AvatarImage src={user.profileImageUrl || ""} alt="Profile" />
              <AvatarFallback className="text-2xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="profile-name">
                {user.firstName} {user.lastName}
              </h1>
              {user.email && (
                <p className="text-gray-600" data-testid="profile-email">{user.email}</p>
              )}
              {user.bio && (
                <p className="text-gray-700 mt-2" data-testid="profile-bio">{user.bio}</p>
              )}
            </div>
            
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900" data-testid="recipes-count">
                  {user?.recipes?.length ?? 0}
                </p>
                <p className="text-gray-600 text-sm">Recipes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900" data-testid="followers-count">
                  {user?.followers?.length ?? 0}
                </p>
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900" data-testid="following-count">
                  {user?.following?.length ?? 0}
                </p>
                <p className="text-gray-600 text-sm">Following</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="my-recipes-title">
            My Recipes
          </h2>
          
          {user.recipes?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👨‍🍳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recipes Yet</h3>
                <p className="text-gray-600 mb-6">Share your first recipe with the world!</p>
                <Button 
                  onClick={() => setLocation("/create")}
                  data-testid="create-first-recipe-button"
                >
                  Create Recipe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {user.recipes?.map((recipe: RecipeWithCreator) => (
                <Card 
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRecipeClick(recipe.id)}
                  data-testid={`user-recipe-${recipe.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        {recipe.imageUrl ? (
                          <img 
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover rounded-l-lg"
                            data-testid={`user-recipe-image-${recipe.id}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 rounded-l-lg flex items-center justify-center">
                            <div className="text-2xl">🍽️</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1" data-testid={`user-recipe-title-${recipe.id}`}>
                          {recipe.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          {recipe.cookTime && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {recipe.cookTime}
                            </span>
                          )}
                          {recipe.servings && (
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {recipe.servings}
                            </span>
                          )}
                          <span>❤️ {recipe.likesCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav onCreateClick={handleCreateClick} />
    </div>
  );
}

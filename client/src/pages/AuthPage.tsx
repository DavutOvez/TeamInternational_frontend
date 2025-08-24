import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, loginUserSchema } from "@shared/schema";
import type { z } from "zod";

type RegisterFormData = z.infer<typeof insertUserSchema>;
type LoginFormData = z.infer<typeof loginUserSchema>;


export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("login");
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", email: "", password: "", firstName: "", lastName: "", bio: "", profileImageUrl: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => (await apiRequest("POST", "/api/auth/login/", data)).json(),

    onSuccess: (res: any) => {
  // JWT token'ı sakla
  localStorage.setItem("accessToken", res.access);
  localStorage.setItem("refreshToken", res.refresh);

  // Kullanıcı bilgisini al
  const user = res.user;

  toast({
    title: "Welcome back!",
    description: `Good to see you again, ${user.firstName || user.username}!`,
  });

  setUser(user);
  setIsAuthenticated(true);

  setLocation("/profile");
},
onError: (err: Error) =>
  toast({
    title: "Login failed",
    description: err.message.replace(/^401: /, ""),
    variant: "destructive",
  }),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => (await apiRequest("POST", "/api/auth/register/", data)).json(),
    onSuccess: (user) => {
      toast({ title: "Welcome!", description: `Account created successfully, ${user.firstName || user.username}!` });
      setLocation("/");
    },
    onError: (err: Error) => toast({ title: "Registration failed", description: err.message.replace(/^400: /, ""), variant: "destructive" }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-red-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cheffit</h1>
          <p className="text-gray-600">Discover recipes you'll love</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>Sign in or create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl><Input placeholder="Username" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
                    <FormField control={registerForm.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl><Input placeholder="Username" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={registerForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl><Input type="email" placeholder="Email" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={registerForm.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input placeholder="First name" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input placeholder="Last name" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={registerForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
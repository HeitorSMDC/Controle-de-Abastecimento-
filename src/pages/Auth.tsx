// src/pages/Auth.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/defesa-civil-logo.png";
import { PasswordField } from "@/components/PasswordField";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success("E-mail de recuperação enviado!", {
        description: "Verifique a sua caixa de entrada para um link de redefinição de senha.",
        duration: 10000,
      });
      setIsRecovering(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao solicitar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        // --- ALTERAÇÃO AQUI: Redireciona explicitamente para /login após a confirmação do e-mail ---
        const redirectUrl = `${window.location.origin}/login`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome,
            },
          },
        });
        
        if (error) throw error;
        
        toast.success("Conta criada com sucesso! Por favor, verifique o seu email.");
        setIsLogin(true); 
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleView = (view: 'login' | 'signup' | 'recover') => {
    setEmail("");
    setPassword("");
    setNome("");
    if (view === 'recover') {
      setIsRecovering(true);
      setIsLogin(true);
    } else {
      setIsRecovering(false);
      setIsLogin(view === 'login');
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Defesa Civil" className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl">Sistema de Controle de Veículos</CardTitle>
          <CardDescription>
            {isRecovering ? "Recuperação de Senha" : "Defesa Civil - Campos dos Goytacazes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Formulário de Recuperação de Senha */}
          {isRecovering ? (
            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => toggleView('login')}
                disabled={loading}
              >
                Voltar para o Login
              </Button>
            </form>
          ) : (
            /* Formulário de Login/Cadastro */
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Seu nome completo"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={(value) => setPassword(value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              
              {isLogin && (
                <p className="text-right text-sm">
                  <Button type="button" variant="link" size="sm" onClick={() => toggleView('recover')} className="p-0 h-auto font-normal">
                    Esqueceu a senha?
                  </Button>
                </p>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => toggleView(isLogin ? 'signup' : 'login')}
                disabled={loading}
              >
                {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
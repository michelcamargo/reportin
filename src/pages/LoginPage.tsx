import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Box, Button, TextField, Typography, Stack, Alert, Link as MuiLink } from "@mui/material";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Formato inválido.");
    try {
      setError("");
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/", { replace: true });
    } catch (error) {
      const err = error as any;
      console.error("Login erro:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Email ou senha incorretos.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Autenticação por Email/Senha não está ativada no Firebase!");
      } else {
        setError(`Falha ao fazer login: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Stack spacing={4} sx={{ width: "100%", maxWidth: 400 }} component="form" onSubmit={handleLogin}>
        <Stack spacing={1} textAlign="center">
          <Typography variant="h4" fontWeight={800} color="primary.main">
            ReportIn
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Insira suas credenciais para acessar a plataforma
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={<LoginIcon />}
            sx={{ py: 1.5 }}
          >
            {loading ? "Autenticando..." : "Entrar no App"}
          </Button>
        </Stack>
        
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Ainda não tem uma conta?{" "}
          <MuiLink component={RouterLink} to="/register" fontWeight={600} underline="hover">
            Criar acesso
          </MuiLink>
        </Typography>
      </Stack>
    </Box>
  );
}

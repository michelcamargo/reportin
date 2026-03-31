import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Box, Button, TextField, Typography, Stack, Alert, Link as MuiLink } from "@mui/material";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useAuth } from "../contexts/AuthContext";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirecionar se já logado
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("As senhas não coincidem.");
    }
    try {
      setError("");
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/", { replace: true });
    } catch (error) {
      const err = error as Error & { code?: string };
      console.error("Cadastro erro:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este email já está cadastrado.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Erro: A Autenticação por Email/Senha não está ativada no Console do Firebase!");
      } else {
        setError(`Falha ao registrar: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Stack spacing={4} sx={{ width: "100%", maxWidth: 400 }} component="form" onSubmit={handleRegister}>
        <Stack spacing={1} textAlign="center">
          <Typography variant="h4" fontWeight={800} color="primary.main">
            Criar Acesso
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Informe um email para salvar seus relatórios técnicos em nuvem.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack spacing={2.5}>
          <TextField
            label="Email de Acesso"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha (Mínimo 6 caracteres)"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirme a Senha"
            type="password"
            required
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={<PersonAddIcon />}
            sx={{ py: 1.5 }}
          >
            {loading ? "Cadastrando..." : "Confirmar Cadastro"}
          </Button>
        </Stack>
        
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Já tem conta?{" "}
          <MuiLink component={RouterLink} to="/login" fontWeight={600} underline="hover">
            Faça Login
          </MuiLink>
        </Typography>
      </Stack>
    </Box>
  );
}

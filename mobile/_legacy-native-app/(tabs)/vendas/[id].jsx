import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { getPedidoVenda, updatePedidoVendaStatus } from "../../../src/features/vendas/api.js";
import { useRealtimeInvalidate } from "../../../src/hooks/useRealtimeInvalidate.js";
import { Button } from "../../../src/ui/Button.jsx";
import { Card } from "../../../src/ui/Card.jsx";
import { StatusVendaBadge } from "../../../src/ui/StatusBadge.jsx";
import { colors, spacing } from "../../../src/ui/theme.js";

const TRANSICOES = {
  ABERTO: ["SEPARACAO", "CANCELADO"],
  SEPARACAO: ["CANCELADO"],
  FATURADO: [],
  CANCELADO: [],
};

const ROTULOS = {
  SEPARACAO: "Enviar para separação",
  CANCELADO: "Cancelar pedido",
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function VendaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [transicaoEmAndamento, setTransicaoEmAndamento] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await getPedidoVenda(id);
      setPedido(dados);
      setErro("");
    } catch (err) {
      setErro(err.message ?? "Não foi possível carregar este pedido.");
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  useRealtimeInvalidate("/vendas/pedidos", carregar);

  function confirmarTransicao(status) {
    if (status === "CANCELADO") {
      Alert.alert("Cancelar este pedido?", "Essa ação não pode ser desfeita.", [
        { text: "Voltar", style: "cancel" },
        { text: "Sim, cancelar", style: "destructive", onPress: () => aplicarTransicao(status) },
      ]);
      return;
    }
    aplicarTransicao(status);
  }

  async function aplicarTransicao(status) {
    setTransicaoEmAndamento(status);
    try {
      await updatePedidoVendaStatus(id, status);
      await carregar();
    } catch (err) {
      Alert.alert("Não foi possível atualizar o status", err.message ?? "Tente novamente.");
    } finally {
      setTransicaoEmAndamento(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro || !pedido) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro || "Pedido não encontrado."}</Text>
      </View>
    );
  }

  const transicoes = TRANSICOES[pedido.status] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{pedido.cliente.participante.razaoSocial}</Text>
          <Text style={styles.subtitulo}>
            {pedido.cliente.participante.cpfCnpj} · {formatarData(pedido.dataEmissao)}
          </Text>
        </View>
        <StatusVendaBadge status={pedido.status} />
      </View>

      <Card style={styles.cardItens}>
        {pedido.itens.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitulo}>{item.produto.descricao}</Text>
            <Text style={styles.itemSub}>
              {item.produto.codigo} · Qtd. {item.quantidade} · {formatarMoeda(item.precoUnitario)}
            </Text>
          </View>
        ))}
      </Card>

      {pedido.status === "SEPARACAO" && (
        <Button variant="secondary" onPress={() => router.push(`/separador/${id}`)}>
          Ir para separação
        </Button>
      )}

      {transicoes.map((status) => (
        <Button
          key={status}
          variant={status === "CANCELADO" ? "danger" : "secondary"}
          loading={transicaoEmAndamento === status}
          disabled={Boolean(transicaoEmAndamento)}
          onPress={() => confirmarTransicao(status)}
        >
          {ROTULOS[status] ?? status}
        </Button>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    padding: spacing.md,
    gap: spacing.md,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  erro: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 2,
  },
  cardItens: {
    padding: 0,
    overflow: "hidden",
  },
  item: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

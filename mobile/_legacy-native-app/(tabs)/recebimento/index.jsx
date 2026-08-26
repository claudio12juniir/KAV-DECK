import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { listPedidosCompra } from "../../../src/features/compras/api.js";
import { useRealtimeInvalidate } from "../../../src/hooks/useRealtimeInvalidate.js";
import { StatusCompraBadge } from "../../../src/ui/StatusBadge.jsx";
import { colors, radius, spacing } from "../../../src/ui/theme.js";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function RecebimentoListScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setErro("");
    try {
      // Pedidos que ainda cabem receber mercadoria: aprovados (nada
      // recebido ainda) ou já com recebimento parcial.
      const [aprovados, parciais] = await Promise.all([
        listPedidosCompra({ status: "APROVADO", pageSize: 50 }),
        listPedidosCompra({ status: "RECEBIDO_PARCIAL", pageSize: 50 }),
      ]);
      setPedidos([...parciais.items, ...aprovados.items]);
    } catch (err) {
      setErro(err.message ?? "Não foi possível carregar os pedidos.");
    }
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  useRealtimeInvalidate("/compras/pedidos", carregar);

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoMuted}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.lista}
      data={pedidos}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
      ListEmptyComponent={
        <View style={styles.centro}>
          <Text style={styles.textoMuted}>{erro || "Nenhum pedido pronto para receber no momento."}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.linha} onPress={() => router.push(`/recebimento/${item.id}`)}>
          <View style={styles.linhaInfo}>
            <Text style={styles.linhaTitulo}>{item.fornecedor.participante.razaoSocial}</Text>
            <Text style={styles.linhaSub}>{formatarData(item.dataEmissao)}</Text>
          </View>
          <StatusCompraBadge status={item.status} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  lista: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  textoMuted: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  linha: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  linhaInfo: {
    flex: 1,
    gap: 2,
  },
  linhaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  linhaSub: {
    fontSize: 13,
    color: colors.textFaint,
  },
});

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { listPedidosCompra } from "../../../src/features/compras/api.js";
import { useRealtimeInvalidate } from "../../../src/hooks/useRealtimeInvalidate.js";
import { StatusCompraBadge } from "../../../src/ui/StatusBadge.jsx";
import { colors, radius, spacing } from "../../../src/ui/theme.js";

const FILTROS = [
  { valor: "", label: "Todos" },
  { valor: "ABERTO", label: "Aberto" },
  { valor: "APROVADO", label: "Aprovado" },
  { valor: "RECEBIDO_PARCIAL", label: "Recebido parcial" },
  { valor: "RECEBIDO", label: "Recebido" },
  { valor: "CANCELADO", label: "Cancelado" },
];

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ComprasListScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const { items } = await listPedidosCompra({ status: status || undefined, pageSize: 50 });
      setPedidos(items);
    } catch (err) {
      setErro(err.message ?? "Não foi possível carregar os pedidos.");
    }
  }, [status]);

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

  return (
    <View style={styles.container}>
      <View style={styles.filtros}>
        {FILTROS.map((filtro) => (
          <Pressable
            key={filtro.valor}
            onPress={() => setStatus(filtro.valor)}
            style={[styles.chip, status === filtro.valor && styles.chipAtivo]}
          >
            <Text style={[styles.chipTexto, status === filtro.valor && styles.chipTextoAtivo]}>
              {filtro.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <Text style={styles.textoMuted}>Carregando pedidos...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={pedidos}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Text style={styles.textoMuted}>{erro || "Nenhum pedido de compra encontrado."}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.linha} onPress={() => router.push(`/compras/${item.id}`)}>
              <View style={styles.linhaInfo}>
                <Text style={styles.linhaTitulo}>{item.fornecedor.participante.razaoSocial}</Text>
                <Text style={styles.linhaSub}>{formatarData(item.dataEmissao)}</Text>
              </View>
              <StatusCompraBadge status={item.status} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filtros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextoAtivo: {
    color: colors.accentText,
  },
  lista: {
    padding: spacing.md,
    paddingTop: spacing.sm,
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

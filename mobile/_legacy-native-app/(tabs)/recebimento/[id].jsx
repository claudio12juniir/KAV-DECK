import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getPedidoCompra, receberPedidoCompra } from "../../../src/features/compras/api.js";
import { useRealtimeInvalidate } from "../../../src/hooks/useRealtimeInvalidate.js";
import { Button } from "../../../src/ui/Button.jsx";
import { Card } from "../../../src/ui/Card.jsx";
import { colors, radius, spacing } from "../../../src/ui/theme.js";

function formatarData(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function RecebimentoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const itensInicializados = useRef(false);

  const [fornecedorNome, setFornecedorNome] = useState("");
  const [status, setStatus] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [sif, setSif] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [pickerAbertoPara, setPickerAbertoPara] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const pedido = await getPedidoCompra(id);
      setFornecedorNome(pedido.fornecedor.participante.razaoSocial);
      setStatus(pedido.status);
      // Só monta as linhas editáveis na primeira carga — um refresh em
      // tempo real não pode apagar o que o conferente já digitou.
      if (!itensInicializados.current) {
        setItens(
          pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            codigo: item.produto.codigo,
            descricao: item.produto.descricao,
            quantidadePedida: item.quantidade,
            quantidade: String(item.quantidade),
            dataValidade: "",
          })),
        );
        itensInicializados.current = true;
      }
      setErro("");
    } catch (err) {
      setErro(err.message ?? "Não foi possível carregar este pedido.");
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  useRealtimeInvalidate("/compras/pedidos", carregar);

  function alterarItem(produtoId, patch) {
    setItens((prev) => prev.map((item) => (item.produtoId === produtoId ? { ...item, ...patch } : item)));
  }

  const podeSalvar = itens.length > 0 && itens.every((item) => Number(item.quantidade) > 0) && !salvando;

  async function handleSalvar() {
    setSalvando(true);
    try {
      await receberPedidoCompra(
        id,
        itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: String(item.quantidade),
          ...(item.dataValidade ? { dataValidade: item.dataValidade } : {}),
          ...(sif ? { sif } : {}),
          ...(temperatura ? { temperaturaRecebimento: String(temperatura) } : {}),
          ...(veiculo ? { veiculo } : {}),
        })),
      );
      Alert.alert("Recebimento registrado", "O estoque foi atualizado com os lotes recebidos.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Não foi possível registrar o recebimento", err.message ?? "Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro && itens.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  const podeReceber = status === "APROVADO" || status === "RECEBIDO_PARCIAL";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View>
        <Text style={styles.titulo}>{fornecedorNome}</Text>
        <Text style={styles.subtitulo}>Pedido de compra</Text>
      </View>

      {!podeReceber ? (
        <Text style={styles.textoMuted}>Este pedido não está mais liberado para recebimento.</Text>
      ) : (
        <>
          <Card>
            <Text style={styles.cardTitulo}>Informações do recebimento</Text>
            <Text style={styles.textoMuted}>Preenchidas uma vez e aplicadas a todos os itens desta entrega.</Text>

            <View style={styles.camposCompartilhados}>
              <View style={styles.campo}>
                <Text style={styles.label}>SIF (opcional)</Text>
                <TextInput style={styles.input} value={sif} onChangeText={setSif} />
              </View>
              <View style={styles.campo}>
                <Text style={styles.label}>Temperatura °C (opcional)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={temperatura}
                  onChangeText={setTemperatura}
                />
              </View>
              <View style={styles.campo}>
                <Text style={styles.label}>Veículo (opcional)</Text>
                <TextInput style={styles.input} value={veiculo} onChangeText={setVeiculo} />
              </View>
            </View>
          </Card>

          <Card style={styles.cardItens}>
            {itens.map((item) => (
              <View key={item.produtoId} style={styles.item}>
                <Text style={styles.itemTitulo}>{item.descricao}</Text>
                <Text style={styles.itemSub}>
                  {item.codigo} · Pedido: {item.quantidadePedida}
                </Text>

                <View style={styles.linhaCampos}>
                  <View style={styles.campo}>
                    <Text style={styles.label}>Qtd. recebida</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      value={item.quantidade}
                      onChangeText={(valor) => alterarItem(item.produtoId, { quantidade: valor })}
                    />
                  </View>

                  <View style={styles.campo}>
                    <Text style={styles.label}>Validade</Text>
                    <Pressable style={styles.inputData} onPress={() => setPickerAbertoPara(item.produtoId)}>
                      <Text style={item.dataValidade ? styles.inputDataTexto : styles.inputDataPlaceholder}>
                        {formatarData(item.dataValidade) ?? "Selecionar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {pickerAbertoPara === item.produtoId && (
                  <DateTimePicker
                    value={item.dataValidade ? new Date(item.dataValidade) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, dataSelecionada) => {
                      setPickerAbertoPara(null);
                      if (event.type === "dismissed" || !dataSelecionada) return;
                      alterarItem(item.produtoId, {
                        dataValidade: dataSelecionada.toISOString().slice(0, 10),
                      });
                    }}
                  />
                )}
              </View>
            ))}
          </Card>

          <Button onPress={handleSalvar} loading={salvando} disabled={!podeSalvar}>
            Confirmar recebimento
          </Button>
        </>
      )}
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
  textoMuted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  camposCompartilhados: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  campo: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  inputData: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inputDataTexto: {
    fontSize: 14,
    color: colors.text,
  },
  inputDataPlaceholder: {
    fontSize: 14,
    color: colors.textFaint,
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
  linhaCampos: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

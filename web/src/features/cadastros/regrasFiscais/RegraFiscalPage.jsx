import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { criarRegraFiscalApi } from "./api.js";

// Sem `searchable`: o backend dessas 6 regras (ver factory.js) só pagina,
// não filtra por texto — ligar a busca aqui mandaria um `q` que o servidor
// silenciosamente ignora, dando a falsa impressão de que filtrou.
export function RegraFiscalPage({ title, description, resource, fields }) {
  return (
    <SimpleCrudManager
      title={title}
      description={description}
      api={criarRegraFiscalApi(resource)}
      resource={resource}
      fields={fields}
    />
  );
}

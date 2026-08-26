import logoKavDeck from "../../assets/logo-kav-deck.png";
import "./PrivacidadePage.css";

// Página pública exigida pelo Google Play (App content > Privacy policy) e pela
// App Store — precisa ficar acessível sem login, por isso mora em PreAuthRoutes
// (ver App.jsx) em vez de dentro do AppShell autenticado.
export function PrivacidadePage() {
  return (
    <div className="privacidade-page">
      <div className="privacidade-conteudo">
        <img src={logoKavDeck} alt="KAV DECK" className="privacidade-logo" />
        <h1>Política de Privacidade</h1>
        <p className="privacidade-atualizacao">Última atualização: 26 de agosto de 2026</p>

        <h2>1. Quem somos</h2>
        <p>
          KAV DECK é um sistema de gestão (ERP) voltado a empresas distribuidoras de
          hortifrutigranjeiros. Esta política descreve como tratamos os dados de quem usa o
          aplicativo e o site do KAV DECK.
        </p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li>Dados de conta: nome e e-mail usados para login (a senha é armazenada de forma criptografada pelo provedor de autenticação).</li>
          <li>Dados operacionais inseridos pela empresa contratante: cadastros de clientes, fornecedores, produtos, pedidos, títulos financeiros e notas fiscais, necessários para o funcionamento do sistema.</li>
          <li>Dados técnicos básicos de acesso e uso, para diagnóstico de erros e segurança.</li>
        </ul>
        <p>
          O aplicativo não solicita permissões sensíveis do celular (câmera, localização,
          contatos) — o acesso é feito exclusivamente por login e senha.
        </p>

        <h2>3. Como usamos os dados</h2>
        <p>
          Os dados são usados exclusivamente para operar o sistema: autenticação, exibição das
          telas de compras, vendas, estoque, financeiro e fiscal, e geração dos relatórios da
          própria empresa contratante. Não usamos os dados para publicidade e não os vendemos a
          terceiros.
        </p>

        <h2>4. Compartilhamento</h2>
        <p>
          Os dados podem ser compartilhados apenas com provedores de infraestrutura
          estritamente necessários à operação do serviço (hospedagem, banco de dados,
          autenticação e, quando aplicável, emissão de notas fiscais eletrônicas junto à
          SEFAZ), sempre sob acordo de confidencialidade. Não compartilhamos dados com
          terceiros para fins de marketing.
        </p>

        <h2>5. Segurança</h2>
        <p>
          As comunicações entre o aplicativo/site e nossos servidores são criptografadas
          (HTTPS). O acesso aos dados de cada empresa contratante é isolado por conta.
        </p>

        <h2>6. Retenção e exclusão</h2>
        <p>
          Os dados são mantidos enquanto a conta estiver ativa. Para solicitar a exclusão dos
          seus dados, entre em contato pelo e-mail abaixo.
        </p>

        <h2>7. Contato</h2>
        <p>
          Dúvidas sobre esta política ou sobre seus dados: <a href="mailto:teclasjunior01@gmail.com">teclasjunior01@gmail.com</a>
        </p>

        <h2>8. Alterações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. A data da última atualização está
          no topo desta página.
        </p>
      </div>
    </div>
  );
}

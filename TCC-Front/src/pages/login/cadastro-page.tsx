import FormCadastro from "../../components/FormCadastro";
import AuthLayout from "../../components/AuthLayout";
import Highlight from "../../components/Highlight";

const CadastroPage = () => {
  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle={
        <>
          Leva menos de um minuto para começar a organizar suas{" "}
          <Highlight tone="money">finanças</Highlight>.
        </>
      }
    >
      <FormCadastro />
    </AuthLayout>
  );
};

export default CadastroPage;

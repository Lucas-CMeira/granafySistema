import FormCadastro from "../../components/FormCadastro";
import AuthLayout from "../../components/AuthLayout";
import Highlight from "../../components/Highlight";

const CadastroPage = () => {
  return (
    <AuthLayout
      title="Crie sua conta ja!"
      subtitle={
        <>
          Leva menos de um minuto para começar a organizar suas {" "}
          <Highlight tone="money"> finanças</Highlight>{" "}
          <strong>com GranaFy</strong>
        </>
      }
    >
      <FormCadastro />
    </AuthLayout>
  );
};

export default CadastroPage;

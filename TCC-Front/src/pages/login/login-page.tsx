import Form from "../../components/Form";
import AuthLayout from "../../components/AuthLayout";
import Highlight from "../../components/Highlight";

const LoginPage = () => {
  return (
    <AuthLayout
      title="Bem-vindo de volta!"
      subtitle={
        <>
          Entre para continuar acompanhando seus <Highlight tone="money">gastos</Highlight>.
        </>
      }
    >
      <Form />
    </AuthLayout>
  );
};

export default LoginPage;

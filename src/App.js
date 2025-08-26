import "./App.css";
import Header from "./Components/Header";
import { Todos } from "./Components/Todos";
import { Footer } from "./Components/Footer";
import { Todo } from "./Components/Todo";

function App() {
  return (
    <>
      <Header title="My Todos List" searchbar={false} />
      <Todos />
      <Footer />
    </>
  );
}

export default App;

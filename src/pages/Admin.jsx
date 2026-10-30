import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Indicadores from "../components/Indicadores";
import ListadeDenuncias from "../components/ListadeDenuncias";
import MapaDenuncias from "../components/MapaDenuncias";
import GraficoDenuncias from "../components/GraficoDenuncias";

import "../Admin.css";

function Admin() {
  return (
<div className="admin">
  <Sidebar />
  <main className="admin-content">
    <Header />
    <Indicadores />
    <section className="dashboard-principal">
      <ListadeDenuncias />
      <MapaDenuncias />
      <GraficoDenuncias />
    </section>
  </main>
</div>
  );
}

export default Admin;
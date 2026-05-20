import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const initialProducer = {
  name: "",
  phone: "",
  municipality: "",
  crop_type: "",
  parcel_size_hectares: "",
  notification_channel: "BOTH",
};

const initialOffer = {
  producer_id: "",
  product_name: "",
  estimated_volume_kg: "",
  harvest_date: "",
  location: "",
  status: "PUBLISHED",
};

const initialBuyer = {
  company_name: "",
  contact_name: "",
  zone: "",
  expected_demand_kg: "",
};

const initialPreorder = {
  buyer_id: "",
  offer_id: "",
  agreed_price_per_kg: "",
  reserved_volume_kg: "",
  pickup_route: "",
};

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [producers, setProducers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [prices, setPrices] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const [traceabilityCode, setTraceabilityCode] = useState("ASO-2026-TOM-001");
  const [traceability, setTraceability] = useState(null);
  const [producerForm, setProducerForm] = useState(initialProducer);
  const [buyerForm, setBuyerForm] = useState(initialBuyer);
  const [offerForm, setOfferForm] = useState(initialOffer);
  const [preorderForm, setPreorderForm] = useState(initialPreorder);
  const [message, setMessage] = useState("");

  async function fetchJson(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "No fue posible completar la solicitud");
    }

    return response.json();
  }

  async function loadData() {
    try {
      const [dashboardData, producerData, buyerData, offerData, priceData, preorderData] =
        await Promise.all([
          fetchJson("/dashboard"),
          fetchJson("/producers"),
          fetchJson("/buyers"),
          fetchJson("/offers"),
          fetchJson("/market-prices"),
          fetchJson("/preorders"),
        ]);

      setDashboard(dashboardData);
      setProducers(producerData);
      setBuyers(buyerData);
      setOffers(offerData);
      setPrices(priceData);
      setPreorders(preorderData);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event, path, payload, reset) {
    event.preventDefault();
    try {
      await fetchJson(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      reset();
      await loadData();
      setMessage("Registro realizado correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function searchTraceability(event) {
    event.preventDefault();
    try {
      const data = await fetchJson(`/traceability/${traceabilityCode}`);
      setTraceability(data);
      setMessage("");
    } catch (error) {
      setTraceability(null);
      setMessage(error.message);
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ACA 3 | Demo funcional</p>
          <h1>Asocampo conecta productores rurales con compradores sin intermediacion excesiva.</h1>
          <p className="hero-text">
            Prototipo web para inventario predictivo, preventa, trazabilidad y comparacion de
            precios con despliegue unificado en Vercel.
          </p>
        </div>
        <div className="hero-card">
          <span>Objetivos cubiertos</span>
          <ul>
            <li>Entrada de informacion de productores y oferta.</li>
            <li>Visualizacion de precios y reportes.</li>
            <li>Registro de roles y flujo de preventa.</li>
            <li>Trazabilidad por orden y ruta de recogida.</li>
          </ul>
        </div>
      </header>

      {message ? <div className="banner">{message}</div> : null}

      <section className="metrics-grid">
        {[
          ["Productores activos", dashboard?.total_producers ?? "--"],
          ["Ofertas publicadas", dashboard?.active_offers ?? "--"],
          ["Preventas", dashboard?.total_preorders ?? "--"],
          ["Precio promedio", dashboard ? `$${dashboard.avg_reference_price.toLocaleString("es-CO")} COP/kg` : "--"],
          ["Ingreso directo estimado", dashboard ? `$${dashboard.estimated_direct_revenue_cop.toLocaleString("es-CO")} COP` : "--"],
          ["Adopcion simulada", dashboard ? `${dashboard.adoption_rate}%` : "--"],
        ].map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <main className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Registro de productor</h2>
            <p>Captura las variables de oferta y contexto rural planteadas en ACA 2.</p>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(
                event,
                "/producers",
                { ...producerForm, parcel_size_hectares: Number(producerForm.parcel_size_hectares) },
                () => setProducerForm(initialProducer),
              )
            }
          >
            <input placeholder="Nombre del productor" value={producerForm.name} onChange={(event) => setProducerForm({ ...producerForm, name: event.target.value })} required />
            <input placeholder="Telefono" value={producerForm.phone} onChange={(event) => setProducerForm({ ...producerForm, phone: event.target.value })} required />
            <input placeholder="Municipio" value={producerForm.municipality} onChange={(event) => setProducerForm({ ...producerForm, municipality: event.target.value })} required />
            <input placeholder="Tipo de cultivo" value={producerForm.crop_type} onChange={(event) => setProducerForm({ ...producerForm, crop_type: event.target.value })} required />
            <input placeholder="Tamano de parcela (ha)" type="number" step="0.1" value={producerForm.parcel_size_hectares} onChange={(event) => setProducerForm({ ...producerForm, parcel_size_hectares: event.target.value })} required />
            <select value={producerForm.notification_channel} onChange={(event) => setProducerForm({ ...producerForm, notification_channel: event.target.value })}>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
              <option value="BOTH">Ambos</option>
            </select>
            <button type="submit">Registrar productor</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Publicar oferta</h2>
            <p>Permite registrar la cosecha antes de la recoleccion para habilitar preventa en origen.</p>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(
                event,
                "/offers",
                {
                  ...offerForm,
                  producer_id: Number(offerForm.producer_id),
                  estimated_volume_kg: Number(offerForm.estimated_volume_kg),
                },
                () => setOfferForm(initialOffer),
              )
            }
          >
            <select value={offerForm.producer_id} onChange={(event) => setOfferForm({ ...offerForm, producer_id: event.target.value })} required>
              <option value="">Seleccione productor</option>
              {producers.map((producer) => (
                <option key={producer.id} value={producer.id}>
                  {producer.name}
                </option>
              ))}
            </select>
            <input placeholder="Producto" value={offerForm.product_name} onChange={(event) => setOfferForm({ ...offerForm, product_name: event.target.value })} required />
            <input placeholder="Volumen estimado (kg)" type="number" value={offerForm.estimated_volume_kg} onChange={(event) => setOfferForm({ ...offerForm, estimated_volume_kg: event.target.value })} required />
            <input type="date" value={offerForm.harvest_date} onChange={(event) => setOfferForm({ ...offerForm, harvest_date: event.target.value })} required />
            <input placeholder="Ubicacion o vereda" value={offerForm.location} onChange={(event) => setOfferForm({ ...offerForm, location: event.target.value })} required />
            <button type="submit">Crear oferta</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Registro de comprador</h2>
            <p>Habilita la demanda esperada y la zona logistica para vincular compras directas.</p>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(
                event,
                "/buyers",
                { ...buyerForm, expected_demand_kg: Number(buyerForm.expected_demand_kg) },
                () => setBuyerForm(initialBuyer),
              )
            }
          >
            <input placeholder="Empresa compradora" value={buyerForm.company_name} onChange={(event) => setBuyerForm({ ...buyerForm, company_name: event.target.value })} required />
            <input placeholder="Contacto" value={buyerForm.contact_name} onChange={(event) => setBuyerForm({ ...buyerForm, contact_name: event.target.value })} required />
            <input placeholder="Zona logistica" value={buyerForm.zone} onChange={(event) => setBuyerForm({ ...buyerForm, zone: event.target.value })} required />
            <input placeholder="Demanda esperada (kg)" type="number" value={buyerForm.expected_demand_kg} onChange={(event) => setBuyerForm({ ...buyerForm, expected_demand_kg: event.target.value })} required />
            <button type="submit">Registrar comprador</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Generar preventa</h2>
            <p>Relaciona oferta, comprador y ruta de recogida para simular venta directa.</p>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(
                event,
                "/preorders",
                {
                  ...preorderForm,
                  buyer_id: Number(preorderForm.buyer_id),
                  offer_id: Number(preorderForm.offer_id),
                  agreed_price_per_kg: Number(preorderForm.agreed_price_per_kg),
                  reserved_volume_kg: Number(preorderForm.reserved_volume_kg),
                },
                () => setPreorderForm(initialPreorder),
              )
            }
          >
            <select value={preorderForm.buyer_id} onChange={(event) => setPreorderForm({ ...preorderForm, buyer_id: event.target.value })} required>
              <option value="">Seleccione comprador</option>
              {buyers.map((buyer) => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.company_name}
                </option>
              ))}
            </select>
            <select value={preorderForm.offer_id} onChange={(event) => setPreorderForm({ ...preorderForm, offer_id: event.target.value })} required>
              <option value="">Seleccione oferta</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.product_name} | {offer.estimated_volume_kg} kg
                </option>
              ))}
            </select>
            <input placeholder="Precio pactado por kg" type="number" value={preorderForm.agreed_price_per_kg} onChange={(event) => setPreorderForm({ ...preorderForm, agreed_price_per_kg: event.target.value })} required />
            <input placeholder="Volumen reservado (kg)" type="number" value={preorderForm.reserved_volume_kg} onChange={(event) => setPreorderForm({ ...preorderForm, reserved_volume_kg: event.target.value })} required />
            <input placeholder="Ruta de recogida" value={preorderForm.pickup_route} onChange={(event) => setPreorderForm({ ...preorderForm, pickup_route: event.target.value })} required />
            <button type="submit">Confirmar preventa</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Trazabilidad</h2>
            <p>Consulta lote, productor, comprador y ruta con el codigo de la orden.</p>
          </div>
          <form className="trace-form" onSubmit={searchTraceability}>
            <input value={traceabilityCode} onChange={(event) => setTraceabilityCode(event.target.value)} placeholder="Codigo de trazabilidad" />
            <button type="submit">Buscar</button>
          </form>
          {traceability ? (
            <div className="trace-card">
              <p><strong>Codigo:</strong> {traceability.traceability_code}</p>
              <p><strong>Productor:</strong> {traceability.producer_name}</p>
              <p><strong>Producto:</strong> {traceability.product_name}</p>
              <p><strong>Cosecha:</strong> {traceability.harvest_date}</p>
              <p><strong>Comprador:</strong> {traceability.buyer_company}</p>
              <p><strong>Ruta:</strong> {traceability.pickup_route}</p>
              <p><strong>Estado:</strong> {traceability.status}</p>
            </div>
          ) : (
            <div className="trace-card empty">Consulta una orden para ver su historial logistico.</div>
          )}
        </section>
      </main>

      <section className="tables-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Dashboard de precios</h2>
            <p>Referencia para reducir asimetria de informacion frente a mercados mayoristas.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mercado</th>
                  <th>Producto</th>
                  <th>Precio/kg</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td>{price.market_name}</td>
                    <td>{price.product_name}</td>
                    <td>${price.price_per_kg.toLocaleString("es-CO")}</td>
                    <td>{price.captured_on}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Ofertas e indicadores</h2>
            <p>Salida de informacion util para compradores y para validacion del demo.</p>
          </div>
          <div className="offer-list">
            {offers.map((offer) => (
              <div key={offer.id} className="offer-card">
                <h3>{offer.product_name}</h3>
                <p>{offer.estimated_volume_kg} kg disponibles</p>
                <p>Cosecha prevista: {offer.harvest_date}</p>
                <span>{offer.location}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="evaluation-strip">
        <article>
          <h2>Matriz de evaluacion sugerida</h2>
          <p>Variable: margen de intermediacion | Indicador: variacion del precio pactado frente al precio de referencia.</p>
          <p>Metodo: registro del sistema + consulta de precios | Resultado esperado: reducir intermediacion y mejorar ingreso del productor.</p>
        </article>
        <article>
          <h2>Aplicacion de ingenieria</h2>
          <p>Entradas: productores, cultivos, precios, demanda. Procesos: registro, comparacion, preventa, trazabilidad. Salidas: orden, ruta, reporte e indicadores.</p>
        </article>
      </section>
    </div>
  );
}

export default App;

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
  const [activeRole, setActiveRole] = useState("producer");
  const [accessMode, setAccessMode] = useState("register");
  const [activeProducerId, setActiveProducerId] = useState("");
  const [activeBuyerId, setActiveBuyerId] = useState("");
  const [message, setMessage] = useState("");

  const activeProducer = producers.find((producer) => String(producer.id) === String(activeProducerId));
  const activeBuyer = buyers.find((buyer) => String(buyer.id) === String(activeBuyerId));
  const producerOffers = offers.filter((offer) => String(offer.producer_id) === String(activeProducerId));
  const buyerPreorders = preorders.filter((preorder) => String(preorder.buyer_id) === String(activeBuyerId));
  const loggedIn = activeRole === "producer" ? Boolean(activeProducerId) : Boolean(activeBuyerId);

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

  async function handleProducerRegistration(event) {
    event.preventDefault();
    try {
      const producer = await fetchJson("/producers", {
        method: "POST",
        body: JSON.stringify({
          ...producerForm,
          parcel_size_hectares: Number(producerForm.parcel_size_hectares),
        }),
      });
      setProducerForm(initialProducer);
      setActiveRole("producer");
      setActiveProducerId(String(producer.id));
      setAccessMode("access");
      await loadData();
      setMessage("Productor registrado y acceso habilitado.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleBuyerRegistration(event) {
    event.preventDefault();
    try {
      const buyer = await fetchJson("/buyers", {
        method: "POST",
        body: JSON.stringify({
          ...buyerForm,
          expected_demand_kg: Number(buyerForm.expected_demand_kg),
        }),
      });
      setBuyerForm(initialBuyer);
      setActiveRole("buyer");
      setActiveBuyerId(String(buyer.id));
      setAccessMode("access");
      await loadData();
      setMessage("Comprador registrado y acceso habilitado.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleOfferSubmit(event) {
    event.preventDefault();
    try {
      await fetchJson("/offers", {
        method: "POST",
        body: JSON.stringify({
          ...offerForm,
          producer_id: Number(activeProducerId),
          estimated_volume_kg: Number(offerForm.estimated_volume_kg),
        }),
      });
      setOfferForm({ ...initialOffer, producer_id: activeProducerId });
      await loadData();
      setMessage("Oferta publicada correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handlePreorderSubmit(event) {
    event.preventDefault();
    try {
      await fetchJson("/preorders", {
        method: "POST",
        body: JSON.stringify({
          ...preorderForm,
          buyer_id: Number(activeBuyerId),
          offer_id: Number(preorderForm.offer_id),
          agreed_price_per_kg: Number(preorderForm.agreed_price_per_kg),
          reserved_volume_kg: Number(preorderForm.reserved_volume_kg),
        }),
      });
      setPreorderForm({ ...initialPreorder, buyer_id: activeBuyerId });
      await loadData();
      setMessage("Preventa confirmada correctamente.");
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

  function switchRole(role) {
    setActiveRole(role);
    setMessage("");
    setTraceability(null);
    setAccessMode("access");
  }

  function logout() {
    setActiveProducerId("");
    setActiveBuyerId("");
    setTraceability(null);
    setAccessMode("register");
    setMessage("Sesion cerrada.");
  }

  return (
    <div className="page-shell">
      <header className="hero hero-split">
        <div className="hero-copy">
          <p className="eyebrow">ACA 3 | Demo funcional</p>
          <h1>Una plataforma, dos portales y una cadena comercial mas corta.</h1>
          <p className="hero-text">
            Asocampo separa la experiencia del productor y del comprador para que cada actor vea
            solo las acciones que necesita: publicar oferta, reservar cosecha, seguir pedidos y
            tomar decisiones con informacion visible.
          </p>
          <div className="hero-pills">
            <span>React + FastAPI</span>
            <span>PostgreSQL + Neon</span>
            <span>Deploy publico en Vercel</span>
          </div>
        </div>

        <div className="access-panel">
          <div className="role-tabs">
            <button
              className={activeRole === "producer" ? "active" : ""}
              onClick={() => switchRole("producer")}
              type="button"
            >
              Portal productor
            </button>
            <button
              className={activeRole === "buyer" ? "active" : ""}
              onClick={() => switchRole("buyer")}
              type="button"
            >
              Portal comprador
            </button>
          </div>

          <div className="access-toggle">
            <button
              className={accessMode === "register" ? "active" : ""}
              onClick={() => setAccessMode("register")}
              type="button"
            >
              Registrarse
            </button>
            <button
              className={accessMode === "access" ? "active" : ""}
              onClick={() => setAccessMode("access")}
              type="button"
            >
              Ingresar
            </button>
          </div>

          {accessMode === "register" && activeRole === "producer" ? (
            <form className="form-grid compact" onSubmit={handleProducerRegistration}>
              <h2>Crear cuenta de productor</h2>
              <input
                placeholder="Nombre del productor"
                value={producerForm.name}
                onChange={(event) => setProducerForm({ ...producerForm, name: event.target.value })}
                required
              />
              <input
                placeholder="Telefono"
                value={producerForm.phone}
                onChange={(event) => setProducerForm({ ...producerForm, phone: event.target.value })}
                required
              />
              <input
                placeholder="Municipio"
                value={producerForm.municipality}
                onChange={(event) =>
                  setProducerForm({ ...producerForm, municipality: event.target.value })
                }
                required
              />
              <input
                placeholder="Tipo de cultivo"
                value={producerForm.crop_type}
                onChange={(event) =>
                  setProducerForm({ ...producerForm, crop_type: event.target.value })
                }
                required
              />
              <input
                placeholder="Tamano de parcela (ha)"
                type="number"
                step="0.1"
                value={producerForm.parcel_size_hectares}
                onChange={(event) =>
                  setProducerForm({
                    ...producerForm,
                    parcel_size_hectares: event.target.value,
                  })
                }
                required
              />
              <select
                value={producerForm.notification_channel}
                onChange={(event) =>
                  setProducerForm({ ...producerForm, notification_channel: event.target.value })
                }
              >
                <option value="SMS">SMS</option>
                <option value="PUSH">Push</option>
                <option value="BOTH">Ambos</option>
              </select>
              <button type="submit">Crear acceso productor</button>
            </form>
          ) : null}

          {accessMode === "register" && activeRole === "buyer" ? (
            <form className="form-grid compact" onSubmit={handleBuyerRegistration}>
              <h2>Crear cuenta de comprador</h2>
              <input
                placeholder="Empresa compradora"
                value={buyerForm.company_name}
                onChange={(event) => setBuyerForm({ ...buyerForm, company_name: event.target.value })}
                required
              />
              <input
                placeholder="Contacto"
                value={buyerForm.contact_name}
                onChange={(event) => setBuyerForm({ ...buyerForm, contact_name: event.target.value })}
                required
              />
              <input
                placeholder="Zona logistica"
                value={buyerForm.zone}
                onChange={(event) => setBuyerForm({ ...buyerForm, zone: event.target.value })}
                required
              />
              <input
                placeholder="Demanda esperada (kg)"
                type="number"
                value={buyerForm.expected_demand_kg}
                onChange={(event) =>
                  setBuyerForm({ ...buyerForm, expected_demand_kg: event.target.value })
                }
                required
              />
              <button type="submit">Crear acceso comprador</button>
            </form>
          ) : null}

          {accessMode === "access" && activeRole === "producer" ? (
            <div className="access-card">
              <h2>Ingresar como productor</h2>
              <p>Selecciona un productor ya registrado para entrar a su panel.</p>
              <select
                value={activeProducerId}
                onChange={(event) => {
                  setActiveProducerId(event.target.value);
                  setOfferForm({ ...initialOffer, producer_id: event.target.value });
                }}
              >
                <option value="">Seleccione productor</option>
                {producers.map((producer) => (
                  <option key={producer.id} value={producer.id}>
                    {producer.name} | {producer.municipality}
                  </option>
                ))}
              </select>
              {activeProducer ? (
                <div className="session-chip">
                  <strong>{activeProducer.name}</strong>
                  <span>{activeProducer.crop_type} | {activeProducer.municipality}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {accessMode === "access" && activeRole === "buyer" ? (
            <div className="access-card">
              <h2>Ingresar como comprador</h2>
              <p>Selecciona una empresa compradora para entrar al panel comercial.</p>
              <select
                value={activeBuyerId}
                onChange={(event) => {
                  setActiveBuyerId(event.target.value);
                  setPreorderForm({ ...initialPreorder, buyer_id: event.target.value });
                }}
              >
                <option value="">Seleccione comprador</option>
                {buyers.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.company_name} | {buyer.zone}
                  </option>
                ))}
              </select>
              {activeBuyer ? (
                <div className="session-chip">
                  <strong>{activeBuyer.company_name}</strong>
                  <span>{activeBuyer.contact_name} | Demanda {activeBuyer.expected_demand_kg} kg</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {message ? <div className="banner">{message}</div> : null}

      <section className="metrics-grid">
        {[
          ["Productores activos", dashboard?.total_producers ?? "--"],
          ["Ofertas publicadas", dashboard?.active_offers ?? "--"],
          ["Preventas", dashboard?.total_preorders ?? "--"],
          [
            "Precio promedio",
            dashboard ? `$${dashboard.avg_reference_price.toLocaleString("es-CO")} COP/kg` : "--",
          ],
          [
            "Ingreso directo estimado",
            dashboard ? `$${dashboard.estimated_direct_revenue_cop.toLocaleString("es-CO")} COP` : "--",
          ],
          ["Adopcion simulada", dashboard ? `${dashboard.adoption_rate}%` : "--"],
        ].map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      {loggedIn ? (
        <section className="workspace-header">
          <div>
            <p className="eyebrow">Sesion activa</p>
            <h2>
              {activeRole === "producer"
                ? `Panel del productor: ${activeProducer?.name ?? ""}`
                : `Panel del comprador: ${activeBuyer?.company_name ?? ""}`}
            </h2>
            <p>
              {activeRole === "producer"
                ? "Aqui puedes publicar oferta, consultar tus cosechas y seguir la trazabilidad."
                : "Aqui puedes revisar el mercado, reservar oferta y seguir el estado de tus preventas."}
            </p>
          </div>
          <button className="ghost-button" onClick={logout} type="button">
            Cerrar sesion
          </button>
        </section>
      ) : (
        <section className="workspace-header locked">
          <div>
            <p className="eyebrow">Acceso requerido</p>
            <h2>Registra o selecciona un perfil para habilitar las herramientas del portal.</h2>
            <p>La navegacion operativa de productor y comprador se activa unicamente despues del acceso.</p>
          </div>
        </section>
      )}

      {loggedIn && activeRole === "producer" ? (
        <main className="content-grid producer-layout">
          <section className="panel spotlight-panel">
            <div className="panel-heading">
              <h2>Mi perfil rural</h2>
              <p>Datos del productor autenticado dentro del demo.</p>
            </div>
            <div className="profile-stat-grid">
              <div>
                <span>Cultivo principal</span>
                <strong>{activeProducer?.crop_type}</strong>
              </div>
              <div>
                <span>Municipio</span>
                <strong>{activeProducer?.municipality}</strong>
              </div>
              <div>
                <span>Parcela</span>
                <strong>{activeProducer?.parcel_size_hectares} ha</strong>
              </div>
              <div>
                <span>Canal</span>
                <strong>{activeProducer?.notification_channel}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Publicar nueva oferta</h2>
              <p>Registra la cosecha antes de la recoleccion para negociar en origen.</p>
            </div>
            <form className="form-grid" onSubmit={handleOfferSubmit}>
              <input
                placeholder="Producto"
                value={offerForm.product_name}
                onChange={(event) => setOfferForm({ ...offerForm, product_name: event.target.value })}
                required
              />
              <input
                placeholder="Volumen estimado (kg)"
                type="number"
                value={offerForm.estimated_volume_kg}
                onChange={(event) =>
                  setOfferForm({ ...offerForm, estimated_volume_kg: event.target.value })
                }
                required
              />
              <input
                type="date"
                value={offerForm.harvest_date}
                onChange={(event) => setOfferForm({ ...offerForm, harvest_date: event.target.value })}
                required
              />
              <input
                placeholder="Ubicacion o vereda"
                value={offerForm.location}
                onChange={(event) => setOfferForm({ ...offerForm, location: event.target.value })}
                required
              />
              <button type="submit">Publicar oferta</button>
            </form>
          </section>

          <section className="panel full-width">
            <div className="panel-heading">
              <h2>Mis ofertas publicadas</h2>
              <p>Resumen de las ofertas asociadas al productor que ingreso al sistema.</p>
            </div>
            <div className="offer-list">
              {producerOffers.length ? (
                producerOffers.map((offer) => (
                  <div key={offer.id} className="offer-card">
                    <h3>{offer.product_name}</h3>
                    <p>{offer.estimated_volume_kg} kg estimados</p>
                    <p>Cosecha prevista: {offer.harvest_date}</p>
                    <span>{offer.location}</span>
                  </div>
                ))
              ) : (
                <div className="empty-card">Todavia no hay ofertas publicadas para este productor.</div>
              )}
            </div>
          </section>

          <section className="panel full-width">
            <div className="panel-heading">
              <h2>Consulta de trazabilidad</h2>
              <p>Revisa productor, comprador, lote y ruta usando el codigo de la orden.</p>
            </div>
            <form className="trace-form" onSubmit={searchTraceability}>
              <input
                value={traceabilityCode}
                onChange={(event) => setTraceabilityCode(event.target.value)}
                placeholder="Codigo de trazabilidad"
              />
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
      ) : null}

      {loggedIn && activeRole === "buyer" ? (
        <main className="content-grid buyer-layout">
          <section className="panel spotlight-panel">
            <div className="panel-heading">
              <h2>Mi perfil comprador</h2>
              <p>Panel comercial con foco en demanda, oferta disponible y preventa.</p>
            </div>
            <div className="profile-stat-grid">
              <div>
                <span>Empresa</span>
                <strong>{activeBuyer?.company_name}</strong>
              </div>
              <div>
                <span>Zona</span>
                <strong>{activeBuyer?.zone}</strong>
              </div>
              <div>
                <span>Contacto</span>
                <strong>{activeBuyer?.contact_name}</strong>
              </div>
              <div>
                <span>Demanda</span>
                <strong>{activeBuyer?.expected_demand_kg} kg</strong>
              </div>
            </div>
          </section>

          <section className="panel full-width">
            <div className="panel-heading">
              <h2>Dashboard de precios</h2>
              <p>Referencia para negociar compras directas con mejor visibilidad del mercado.</p>
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
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Generar preventa</h2>
              <p>Reserva oferta, define precio pactado y registra la ruta de recogida.</p>
            </div>
            <form className="form-grid" onSubmit={handlePreorderSubmit}>
              <select
                value={preorderForm.offer_id}
                onChange={(event) => setPreorderForm({ ...preorderForm, offer_id: event.target.value })}
                required
              >
                <option value="">Seleccione oferta</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.product_name} | {offer.estimated_volume_kg} kg
                  </option>
                ))}
              </select>
              <input
                placeholder="Precio pactado por kg"
                type="number"
                value={preorderForm.agreed_price_per_kg}
                onChange={(event) =>
                  setPreorderForm({ ...preorderForm, agreed_price_per_kg: event.target.value })
                }
                required
              />
              <input
                placeholder="Volumen reservado (kg)"
                type="number"
                value={preorderForm.reserved_volume_kg}
                onChange={(event) =>
                  setPreorderForm({ ...preorderForm, reserved_volume_kg: event.target.value })
                }
                required
              />
              <input
                placeholder="Ruta de recogida"
                value={preorderForm.pickup_route}
                onChange={(event) =>
                  setPreorderForm({ ...preorderForm, pickup_route: event.target.value })
                }
                required
              />
              <button type="submit">Confirmar preventa</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Ofertas disponibles</h2>
              <p>Vista de oferta agregada para compradores mayoristas.</p>
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
          </section>

          <section className="panel full-width">
            <div className="panel-heading">
              <h2>Mis preventas y trazabilidad</h2>
              <p>Seguimiento a las reservas generadas por la empresa compradora activa.</p>
            </div>
            <div className="offer-list">
              {buyerPreorders.length ? (
                buyerPreorders.map((preorder) => (
                  <div key={preorder.id} className="offer-card trace-offer">
                    <h3>{preorder.traceability_code}</h3>
                    <p>Oferta: {offers.find((offer) => offer.id === preorder.offer_id)?.product_name ?? "Oferta"}</p>
                    <p>Volumen reservado: {preorder.reserved_volume_kg} kg</p>
                    <p>Precio pactado: ${preorder.agreed_price_per_kg.toLocaleString("es-CO")} COP/kg</p>
                    <span>{preorder.pickup_route}</span>
                  </div>
                ))
              ) : (
                <div className="empty-card">Todavia no hay preventas asociadas a este comprador.</div>
              )}
            </div>
          </section>
        </main>
      ) : null}

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

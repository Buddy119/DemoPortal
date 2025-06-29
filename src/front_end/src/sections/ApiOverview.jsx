const ApiOverview = ({ api }) => (
  <section id="overview" className="mb-8">
    <h1 className="mb-2 text-2xl font-semibold">{api.name}</h1>
    <p className="text-gray-700">{api.description}</p>
  </section>
);

export default ApiOverview;

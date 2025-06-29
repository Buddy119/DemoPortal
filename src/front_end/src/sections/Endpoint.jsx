const Endpoint = ({ api }) => (
  <section id="endpoint" className="mb-8">
    <div className="flex items-center gap-3">
      <span className="inline-block px-3 py-1 rounded bg-blue-700 text-white text-xs font-mono">
        {api.method}
      </span>
      <code className="text-sm break-all">{api.endpoint}</code>
    </div>
  </section>
);

export default Endpoint;

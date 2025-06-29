const ParamTable = ({ params = [] }) => {
  if (!params.length) return null;
  return (
    <section id="params" className="mb-8">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 font-medium">
          <tr>
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="hover:bg-gray-50">
              <td className="px-2 py-1">{p.name}</td>
              <td className="px-2 py-1">{p.type}</td>
              <td className="px-2 py-1">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default ParamTable;

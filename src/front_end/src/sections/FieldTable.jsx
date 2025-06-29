const FieldTable = ({ fields = [] }) => {
  if (!fields.length) return null;
  return (
    <section id="fields" className="mb-8">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 font-medium">
          <tr>
            <th className="px-2 py-1 text-left">Field Name</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="hover:bg-gray-50">
              <td className="px-2 py-1">{f.name}</td>
              <td className="px-2 py-1">{f.type}</td>
              <td className="px-2 py-1">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default FieldTable;

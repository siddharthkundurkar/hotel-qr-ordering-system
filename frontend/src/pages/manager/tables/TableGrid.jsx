import TableCard from "./TableRow";

const TableGrid = ({ tables, setTables }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          tables={tables}
          setTables={setTables}
        />
      ))}
    </div>
  );
};

export default TableGrid;
function Providers() {
  return (
    <div>
      <h1>Find Providers</h1>
      <input type="text" placeholder="Search by name or keyword..." />
      <select>
        <option value="">All Categories</option>
        <option value="tutoring">Tutoring</option>
        <option value="camp">Summer Camp</option>
        <option value="music">Music</option>
        <option value="sports">Sports</option>
        <option value="art">Art & Crafts</option>
      </select>
      <input type="text" placeholder="ZIP Code" />
      <button className="btn btn-primary">Search</button>

      <div className="mt-4">
        <p className="text-center">Enter your search criteria above to find local providers.</p>
      </div>
    </div>
  );
}

export default Providers;
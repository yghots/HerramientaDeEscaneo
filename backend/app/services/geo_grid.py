import math

def generate_grid_cells(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    grid_size_km: float = 1.0
) -> list[dict]:
    """
    Subdivides a bounding box into rectangular grid cells of approximate size grid_size_km x grid_size_km.
    Lima coordinates are around Lat -12.0 deg, Lon -77.0 deg.
    """
    # 1 deg lat ~ 110.57 km
    # 1 deg lon at lat -12 ~ 111.32 * cos(-12 deg) ~ 108.87 km
    avg_lat = (min_lat + max_lat) / 2.0
    lat_km_per_deg = 110.57
    lon_km_per_deg = 111.32 * math.cos(math.radians(avg_lat))

    lat_step = grid_size_km / lat_km_per_deg
    lon_step = grid_size_km / lon_km_per_deg

    cells = []
    cell_idx = 0

    curr_lat = min_lat
    while curr_lat < max_lat:
        next_lat = min(curr_lat + lat_step, max_lat)
        curr_lon = min_lon
        while curr_lon < max_lon:
            next_lon = min(curr_lon + lon_step, max_lon)
            cells.append({
                "cell_index": cell_idx,
                "min_lat": round(curr_lat, 6),
                "max_lat": round(next_lat, 6),
                "min_lon": round(curr_lon, 6),
                "max_lon": round(next_lon, 6)
            })
            cell_idx += 1
            curr_lon = next_lon
        curr_lat = next_lat

    return cells

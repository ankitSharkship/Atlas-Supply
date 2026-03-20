import { useEffect, useState } from "react";
import { getVendorsLookup } from "@/lib/vehicleAssignmentService";

export const useVendorSearch = () => {
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getVendorsLookup(query);

        if (res.success) {
          setVendors(res.data.vendors);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, vendors, loading };
};
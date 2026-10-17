// components/Contador.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RiAddLine, RiSubtractLine } from "@remixicon/react";

export default function Contador() {
  // La pizarra: "cuenta" es el valor, "setCuenta" es la forma de cambiarlo.
  const [cuenta, setCuenta] = useState(0);

  return (
    <div className="mt-4 flex items-center gap-3">
      <Button variant="outline" onClick={() => setCuenta(cuenta - 1)}>
        <RiSubtractLine />
        Restar
      </Button>

      <span className="min-w-8 text-center text-xl font-semibold">{cuenta}</span>

      <Button onClick={() => setCuenta(cuenta + 1)}>
        <RiAddLine />
        Sumar
      </Button>
    </div>
  );
}
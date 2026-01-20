
"use client"

import { isDevDB } from "lib/db";
import { useEffect, useState } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
  }
  
  export default function PageHeader({ title, description }: PageHeaderProps) {

    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
      fetch("/api/dev-flag")
        .then(res => res.json())
        .then(data => setIsDev(data.isDevDB));
    }, []);

    return (
      <div className="flex flex-col gap-2 border-b border-gray-300 px-10 pt-[34px] pb-7">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
          
        )}
        {isDev && <span style={{ color: "red" }}>개발 서버 DB입니다.</span>}
      </div>
    );
  }
  
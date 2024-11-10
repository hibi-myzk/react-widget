import type { MetaFunction } from "@remix-run/node";
import GridLayoutPage from "~/components/GridLayoutPage";

export const meta: MetaFunction = () => {
  return [
    { title: "React Widget" },
    { name: "description", content: "React Widget Demo" },
  ];
};

export default function Index() {
  return (
    <GridLayoutPage />
  );
}

import { FaBookDead, FaFlask, FaRing } from "react-icons/fa";

export default function RelicIcon({ iconKey }: { iconKey: string }) {
  if (iconKey === "ring") return <FaRing aria-hidden="true" />;
  if (iconKey === "book") return <FaBookDead aria-hidden="true" />;
  return <FaFlask aria-hidden="true" />;
}

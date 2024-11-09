import { Link } from "dreamkit";

export default function Users() {
  return (
    // @ts-expect-error
    <Link href="/users/:id" params={{ id: 1 }}>
      User 1
    </Link>
  );
}

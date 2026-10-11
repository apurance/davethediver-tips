import { Link } from "react-router";
import { entityPath, getEntity, name } from "../catalog";

export function EntityLink({ id }: { id: string }) {
  const entity = getEntity(id);
  return entity ? <Link to={entityPath(entity)}>{name(entity.id)}</Link> : <span>{name(id)}</span>;
}

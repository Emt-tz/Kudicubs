import { FamiliesHeader, FamiliesSkeleton } from "./FamiliesView";

// tc-04-families-loading: shown by Next while the list is being fetched.
export default function Loading() {
  return (
    <div className="stack" data-screen="tc-04-families-loading">
      <FamiliesHeader intro="Loading your families..." />
      <FamiliesSkeleton />
    </div>
  );
}

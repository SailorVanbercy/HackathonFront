import {lazy, Suspense} from "react";

interface Props {
    importFn: () => Promise<any>;
}

export function SuspenseWrapper({importFn}: Props) {
    const LazyComponent = lazy(importFn);

    return <Suspense fallback="loading...">
        <LazyComponent/>
    </Suspense>
}
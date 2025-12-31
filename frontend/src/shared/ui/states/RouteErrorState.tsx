import React from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import ErrorState from "./ErrorState";

export default function RouteErrorState() {
    const err = useRouteError();

    let title = "페이지 오류";
    let description = "라우팅 처리 중 오류가 발생했습니다.";

    if (isRouteErrorResponse(err)) {
        // loader/action/lazy에서 터질 때
        title = `RouteError ${err.status}`;
        description = typeof err.data === "string" ? err.data : JSON.stringify(err.data);
    } else if (err instanceof Error) {
        title = err.name;
        description = `${err.message}\n${err.stack ?? ""}`;
    } else if (err) {
        description = JSON.stringify(err);
    }

    return <ErrorState title={title} description={description} />;
}
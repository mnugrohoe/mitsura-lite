import { NextResponse } from "next/server";
import {
  getInventoryPage,
  type InventoryRow,
} from "@/features/inventory/queries";
import type { ApiResponse } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 50;
  const q = searchParams.get("q");
  const whse = searchParams.get("whse");
  const brand = searchParams.get("brand");
  const onhand = searchParams.get("onhand");

  try {
    const result = await getInventoryPage(
      {
        ...(q && { q }),
        ...(whse && { whse }),
        ...(brand && { brand }),
        ...(onhand && { onhand }),
      },
      page,
      pageSize,
    );

    const responseBody: ApiResponse<InventoryRow[]> = {
      success: true,
      message: "Inventory data retrieved successfully",
      data: result.rows,
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
      },
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error,
        data: [],
      },
      { status: 500 },
    );
  }
}

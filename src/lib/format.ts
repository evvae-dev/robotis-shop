export function formatPrice(price: number | null) {
  return price === null ? "견적 문의" : `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

export const productsHref = (categoryId: string) => `/products?category=${encodeURIComponent(categoryId)}`;

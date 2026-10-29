/** 상품 내용 대신 갱신 신호만 전달하고, 실제 데이터는 서버가 Firestore에서 다시 읽습니다. */
export function notifyStoreUpdate() {
  const channel = new BroadcastChannel("robotis-store-updated");
  channel.postMessage("updated");
  channel.close();
}

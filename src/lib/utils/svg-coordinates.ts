/**
 * SVG座標変換ユーティリティ
 * スクリーン座標とSVG座標を相互変換
 */
export class SVGCoordinateTransform {
  /**
   * スクリーン座標をSVG座標に変換
   * @param screenX スクリーンX座標
   * @param screenY スクリーンY座標
   * @param svgElement SVG要素
   * @returns SVG座標
   */
  static screenToSVG(
    screenX: number,
    screenY: number,
    svgElement: SVGSVGElement
  ): { x: number; y: number } {
    const pt = svgElement.createSVGPoint()
    pt.x = screenX
    pt.y = screenY

    const ctm = svgElement.getScreenCTM()
    if (!ctm) {
      // CTMが取得できない場合はそのまま返す
      return { x: screenX, y: screenY }
    }

    const svgPt = pt.matrixTransform(ctm.inverse())

    return { x: svgPt.x, y: svgPt.y }
  }

  /**
   * SVG座標をスクリーン座標に変換
   * @param svgX SVG X座標
   * @param svgY SVG Y座標
   * @param svgElement SVG要素
   * @returns スクリーン座標
   */
  static svgToScreen(
    svgX: number,
    svgY: number,
    svgElement: SVGSVGElement
  ): { x: number; y: number } {
    const pt = svgElement.createSVGPoint()
    pt.x = svgX
    pt.y = svgY

    const ctm = svgElement.getScreenCTM()
    if (!ctm) {
      // CTMが取得できない場合はそのまま返す
      return { x: svgX, y: svgY }
    }

    const screenPt = pt.matrixTransform(ctm)

    return { x: screenPt.x, y: screenPt.y }
  }

  /**
   * イベントからSVG座標を取得
   * @param event ポインターイベント
   * @param svgElement SVG要素
   * @returns SVG座標
   */
  static getEventSVGCoordinates(
    event: PointerEvent,
    svgElement: SVGSVGElement
  ): { x: number; y: number } {
    return this.screenToSVG(event.clientX, event.clientY, svgElement)
  }
}

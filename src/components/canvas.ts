class Canvas {
	ctx: CanvasRenderingContext2D;
	constructor(selectors: Element | string) {
		let el = (typeof selectors === 'string' ? document.querySelector(selectors) : selectors) as HTMLCanvasElement;
		if (!el) {
			throw 'The element does not exist.';
		}
		let ctx = el.getContext('2d');
		if (!ctx) {
			throw 'error';
		}
		this.ctx = ctx;
		this.ctx.scale(this.dpr(), this.dpr());
	}

	/**
	 * CSS 픽셀을 그릴 때 사용해야 하는 장치 픽셀의 값
	 */
	dpr() {
		return window.devicePixelRatio || 1;
	}

	/**
	 * 원하는 픽셀값을 캔버스 픽셀값으로 변환
	 */
	npx(px: number) {
		return parseInt((px * this.dpr()).toString(), 10);
	}

	/**
	 *
	 */
	npxLine(px: number) {
		const n = this.npx(px);
		return n > 0 ? n - 0.5 : 0.5;
	}

	/**
	 * canvas context attribute
	 */
	attr(attr: Record<string, object>) {
		let newAttr = {} as Record<string, object>;
		const keys = Object.keys(attr);
		if (keys.length < 1) {
			return;
		}
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			let value = attr[key];
			if (typeof value === 'function') {
				value = value();
			}
			newAttr[key] = value;
		}
		Object.assign(this.ctx, newAttr);
	}

	/**
	 * 현재 상태를 저장한다.
	 */
	save() {
		this.ctx.save();
		this.ctx.beginPath();
	}

	/**
	 * 가장 최근에 저장한 상태로 되돌린다.
	 */
	restore() {
		this.ctx.restore();
	}

	/**
	 * 캔버스의 해당 좌표로 이동 및 기준으로 설정.
	 */
	translate(x: number, y: number) {
		this.ctx.translate(this.npx(x), this.npx(y));
	}

	/**
	 * 캔버스 해당 영역 채우기
	 */
	fillRect(x: number, y: number, w: number, h: number) {
		this.ctx.fillRect(this.npx(x) - 0.5, this.npx(y) - 0.5, this.npx(w), this.npx(h));
	}

	/**
	 * 캔버스 해당 영역 지우기
	 */
	clearRect(x: number, y: number, w: number, h: number) {
		this.ctx.clearRect(x, y, w, h);
	}

	/**
	 * 캔버스 텍스트 입력
	 */
	text(textStyle: Record<string, object>, x: number, y: number, w: number, h: number, text: string) {
		const nowrap = false;
		const padding = 5;
		const tx = x + padding;
		const width = this.npx(w);
		let fontSize = 12;
		if (textStyle.fontSize) {
			fontSize = parseInt(textStyle.fontSize.toString());
		}

		this.ctx.save();
		this.ctx.beginPath();
		this.attr(textStyle);

		const txts = text.split('\n');
		let ntxts = [] as string[];
		if (txts.length > 0) {
			for (let i = 0; i < txts.length; i++) {
				const txt = txts[i];
				const txtWidth = this.ctx.measureText(txt).width;
				if (txtWidth > width) {
					let textLine = {
						w: 0 + padding + padding,
						len: 0,
						start: 0,
					};
					for (let j = 0; j < txt.length; j++) {
						if (textLine.w > width) {
							ntxts.push(txt.substring(textLine.start, textLine.len));
							if (nowrap) {
								textLine = {
									w: 0 + padding + padding,
									len: 0,
									start: j,
								};
							} else {
								break;
							}
						}
						textLine.len++;
						textLine.w += this.ctx.measureText(txt[j]).width + 0.5 * this.dpr();
					}

					if (nowrap && textLine.len > 0) {
						ntxts.push(txt.substring(textLine.start, textLine.len));
					}
				} else {
					ntxts.push(txt);
				}
			}

			const txtHeight2 = ntxts.length * (fontSize + 2);
			if (txtHeight2 > h) {
				ntxts = ntxts.splice(0, ntxts.length - Math.ceil((txtHeight2 - h) / (fontSize + 2)));
			}
		}

		const txtHeight = (ntxts.length - 1) * (fontSize + 2);
		let ty = y + h / 2 - txtHeight / 2;
		if (ntxts.length > 0) {
			for (let i = 0; i < ntxts.length; i++) {
				const txt = ntxts[i];
				this.ctx.fillText(txt, this.npx(tx), this.npx(ty));
				ty += fontSize + 2;
			}
		}
		this.ctx.restore();
	}

	/**
	 * 캔버스 라인 그리기
	 */
	line(points: [number, number][]) {
		if (points.length < 2) {
			return;
		}

		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			const x = point[0];
			const y = point[1];

			if (i === 0) {
				this.moveTo(x, y);
				continue;
			}
			this.lineTo(x, y);
		}
		this.ctx.stroke();
	}

	/**
	 * 캔버스의 해당 좌표로 이동한다.
	 */
	moveTo(x: number, y: number) {
		this.ctx.moveTo(this.npxLine(x), this.npxLine(y));
	}

	/**
	 * 캔버스 점 입력하기
	 */
	lineTo(x: number, y: number) {
		this.ctx.lineTo(this.npxLine(x), this.npxLine(y));
	}
}

export default Canvas;

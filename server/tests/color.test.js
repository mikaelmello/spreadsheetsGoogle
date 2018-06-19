const colorCtrl = require("../controllers/color.ctrl");

/**
 * Tests methods' behavior
 */
describe("Color acquisition", () => {
	describe("Get a complete color", () => {
		it("shoul be in the right format", (done) => {
			const color = colorCtrl.getColor();

			expect(color[0]).toEqual("#");
			expect(color.slice(1)).toHaveLength(6);

			done();
		});

		it("should be in the right range", (done) => {
			const color = colorCtrl.getColor();
			const MAX = 255;
			const red = color.substring(1, 2);
			const green = color.substring(3, 4);
			const blue = color.substring(5, 6);

			expect(parseInt(red, 16)).toBeLessThanOrEqual(MAX);
			expect(parseInt(green, 16)).toBeLessThanOrEqual(MAX);
			expect(parseInt(blue, 16)).toBeLessThanOrEqual(MAX);

			done();
		});
	});
});

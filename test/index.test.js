const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const rewrite = require('../index');

describe('rewrite tests', () => {
	let rewriteFunc;
	let req;
	let res;
	let next;

	let expect;

	before(async () => {
		const chai = await import('chai');
		chai.use(sinonChai);
		expect = chai.expect;
	});

	beforeEach(() => {
		req = {
			url: '/',
			params: {},
			query: {}
		};
		res = {};
		next = sinon.fake();
	});

	afterEach(() => {
		sinon.restore();
	});

	function testNegativeCase(rewriteFunc, req, res, next) {
		req.url = '/otherPath';

		rewriteFunc(req, res, next);

		expect(req.url).to.equal('/otherPath');
		expect(next).to.have.been.calledWith();
	}

	describe('rewriting using a regular expression', () => {
		beforeEach(() => {
			rewriteFunc = rewrite(/^\/i(\w+)/, '/items/$1');
		});

		it('rewrites if path matches', () => {
			req.url = '/i123';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/items/123');
			expect(next).to.have.been.calledWith();
		});

		it('does not rewrite if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('rewriting using route parameters (capture group)', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/:src..:dst', '/commits/$1/to/$2');
		});

		it('rewrites if path matches 2', () => {
			req.url = '/foo..bar';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/commits/foo/to/bar');
			expect(next).to.have.been.calledWith();
		});

		it('does not rewrite if path does not match 2', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('rewriting using route parameters (capture group)', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/:src..:dst', '/commits/:src/to/:dst');
		});

		it('rewrites if path matches', () => {
			req.url = '/foo..bar';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/commits/foo/to/bar');
			expect(next).to.have.been.calledWith();
		});


		it('does not rewrite if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('rewriting using route parameters (named parameters)', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/:src..:dst', '/commits/:src/to/:dst');
		});

		it('rewrites if path matches', () => {
			req.url = '/foo..bar';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/commits/foo/to/bar');
			expect(next).to.have.been.calledWith();
		});

		it('does not rewrite if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('using the wildcard * to soak up several segments', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/js/*', '/public/assets/js/$1');
		});

		it('rewrites if path matches', () => {
			req.url = '/js/vendor/jquery.js';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/public/assets/js/vendor/jquery.js');
			expect(next).to.have.been.calledWith();
		});

		it('does not rewrite if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('rewriting the url using the original query string', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/file\\?param=:param', '/file/:param');
		});

		it('rewrites if path matches', () => {
			req.url = '/file?param=file1';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/file/file1');
			expect(next).to.have.been.calledWith();
		});

		it('does not rewrite if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
		});
	});

	describe('adding query parameters to the query object output', () => {
		beforeEach(() => {
			rewriteFunc = rewrite('/path', '/anotherpath?param=some');
		});

		it('adds to query parameters if path matches', () => {
			req.url = '/path';

			rewriteFunc(req, res, next);

			expect(req.url).to.equal('/anotherpath?param=some');
			expect(req.query).to.deep.equal({ param: 'some' });
			expect(next).to.have.been.calledWith();
		});

		it('does not add to query parameters if path does not match', () => {
			testNegativeCase(rewriteFunc, req, res, next);
			expect(req.query).to.deep.equal({});
		});
	});

	it('can be used with route middleware (capture group)', () => {
		rewriteFunc = rewrite('/rewritten/$1');

		req.url = '/route/route1';
		req.params = ['', 'route1'];

		rewriteFunc(req, res, next);

		expect(req.url).to.equal('/rewritten/route1');
		expect(next).to.have.been.calledWith('route');
	});

	it('can be used with route middleware (named parameters)', () => {
		rewriteFunc = rewrite('/rewritten/:var');

		req.url = '/route/route1';
		req.params = { var: 'route1' };

		rewriteFunc(req, res, next);

		expect(req.url).to.equal('/rewritten/route1');
		expect(next).to.have.been.calledWith('route');
	});
});

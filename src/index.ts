/**
 * A convenience type definition for a standard type guard. It takes a value of type D and variadic arguments
 * of type A, and indicates whether or not the value is of type T.
 *
 * Functions of this type should _not_ throw an error just because the type check fails, they should be used for
 * true conditional checking.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeGuard<T extends D = any, D = any, A extends Array<unknown> = []> = (
  data: D,
  ...args: A
) => data is T;

/**
 * A convenience type definition for a standard type assertion. It takes a value of type D and variadic arguments
 * of type A, and asserts that the value is of type T. In other words, the function returns _if and only if_ the given value
 * is of type T.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeAssertion<
  T extends D = any,
  D = any,
  A extends Array<unknown> = []
> = (data: D, ...args: A) => asserts data is T;

type AssertedType<A> = A extends TypeAssertion<infer O, infer _> ? O : never;
type InspectedType<A> = A extends TypeAssertion<infer _, infer I> ? I : never;

/**
 * Given a type assertion function, create a TypeChecker.
 */
export function createGuardFromTypeAssertion<
  T extends D,
  D = unknown,
  A extends Array<unknown> = []
>(asserter: TypeAssertion<T, D, A>): TypeGuard<T, D, A> {
  return (data: D, ...args: A): data is T => {
    try {
      asserter(data, ...args);
    } catch (e) {
      return false;
    }
    return true;
  };
}

/**
 * Given a type guard function, create a type assertion function. Returns a function which will
 * throw an error when invoked with a value that doesn't satisfiy the given type guard.
 */
export function createAssertionFromTypeGuard<
  T extends D,
  D = unknown,
  A extends Array<unknown> = []
>(guard: TypeGuard<T, D, A>, message?: string): TypeAssertion<T, D, A> {
  return (data: D, ...args: A): asserts data is T => {
    if (!guard(data, ...args)) {
      const name = guard.name;
      const sayName = name ? ` "${name}"` : "";
      throw namedError(
        "TypeAssertionError",
        message ?? `Value did not satisfy type assertion${sayName}`
      );
    }
  };
}

/**
 * A Type checker that a value matches an expected value, using triple-equality.
 */
export function assertHasValue<
  T extends string | number | boolean | symbol,
  S extends T = T
>(actualValue: T, expectedValue: S): asserts actualValue is S {
  if (expectedValue !== actualValue) {
    throw namedError(
      "TypeAssertionError",
      `Expected value to be ${JSON.stringify(
        expectedValue
      )} but was ${JSON.stringify(actualValue)}`
    );
  }
}

export function valueAsserter<
  T extends string | number | boolean | symbol,
  S extends T = T
>(expectedValue: S): TypeAssertion<S, T> {
  return (actualValue: T): asserts actualValue is S =>
    assertHasValue(actualValue, expectedValue);
}

/**
 * A type guard for strings that throws an error if the value is not a string.
 */
export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw namedError(
      "TypeAssertionError",
      `Expected a string, found type ${typeof value}`
    );
  }
}

/**
 * A type guard for numbers that throws an error if the value is not a number.
 */
export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== "number") {
    throw namedError(
      "TypeAssertionError",
      `Expected a number, found type ${typeof value}`
    );
  }
}

/**
 * A type guard for booleans that throws an error if the value is not a boolean.
 */
export function assertIsBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw namedError(
      "TypeAssertionError",
      `Expected a boolean, found type ${typeof value}`
    );
  }
}

type Key = string | number;

/**
 * Just a convenience type because the built in Object is not very useful.
 */
export type RealObject = Record<Key, unknown>;

/**
 * Type guard that the value is a real object, meaning it is of type 'object' and is not
 * null. Throws an error if the value fails the type assertion.
 */
export function assertIsNonNullObject(
  data: unknown
): asserts data is RealObject {
  if (!data) {
    throw namedError("TypeAssertionError", "Expected non-null object");
  }
  if (typeof data !== "object") {
    throw namedError(
      "TypeAssertionError",
      `Expected an object, found type ${typeof data}`
    );
  }
}

export function assertIsRecordOfStringsToStrings(
  data: RealObject
): asserts data is Record<string, string> {
  Object.entries(data).forEach(([k, v]) => {
    if (typeof k !== "string") {
      throw namedError(
        "TypeAssertionError",
        `Expected key to be a string, found ${String(k)}`
      );
    }
    if (typeof v !== "string") {
      throw namedError(
        "TypeAssertionError",
        `Expected value for key ${k} to be a string, found ${String(v)}`
      );
    }
  });
}

export function assertIsArrayOf<T>(
  data: unknown,
  ...elementAssertions: Array<TypeAssertion<T>>
): asserts data is Array<T> {
  if (!Array.isArray(data)) {
    throw namedError(
      "TypeAssertionError",
      `Expected an array, found type ${typeof data}`
    );
  }
  data.forEach((element: unknown, idx: number) => {
    elementAssertions.forEach(
      (assertion: (value: unknown) => asserts value is T) => {
        try {
          assertion(element);
        } catch (error) {
          throw wrapError(
            error,
            null,
            (c) => `For element ${idx}: ${c.message}`,
            { idx, element }
          );
        }
      }
    );
  });
}

export function assertIsArrayOfStrings(
  data: unknown
): asserts data is Array<string> {
  assertIsArrayOf(data, assertIsString);
}

/**
 * Asserts that an object has the specified property as an own property. If you want to specify more about
 * the type of that property value, use the other forms of this function which allow you to provide
 * type assertion functions to check the value.
 */
export function assertObjectHasOwnProperty<
  F extends Key,
  D extends RealObject = RealObject
>(data: D, field: F): asserts data is D & { [k in F]: unknown };

/**
 * Asserts that an object has a specified property whose values satisfies the given assertion.
 *
 * @typeparam O The type that the property value is asserted to have by this function.
 * @typeparam F the property name.
 * @typeparam A the TypeAssertion that is applied to the property value, (assuming the property value exists).
 * @typeparam D The type of the data that is being inspected by this function.
 */
export function assertObjectHasOwnProperty<
  O extends AssertedType<A>,
  A extends TypeAssertion,
  F extends Key,
  D extends RealObject = RealObject
>(
  data: D,
  field: F,
  fieldValueAssertion1: A
): asserts data is D & { [k in F]: O };

/**
 * Asserts that an object has a specified property whose values satisfies the two given assertions.
 *
 * @typeparam O The type that the property value is asserted to have by this function.
 * @typeparam F the property name.
 * @typeparam A1 the TypeAssertion that is first applied to the property value, (assuming the property value exists).
 * If this assertion passes, then the value will be further asserted against an assertion of type A2, so the type that
 * is asserted by A1 should be the same as the input type to A2.
 * @typeparam A2 The TypeAssertion that is applied second to the property value, if it has passed previous assertions.
 * This is the last type assertion for the property value, so the type asserted by this is the type for the property value
 * that is asserted by the function.
 * @typeparam D The type of the data that is being inspected by this function.
 */
export function assertObjectHasOwnProperty<
  O extends AssertedType<A2>,
  A2 extends TypeAssertion,
  A1 extends TypeAssertion<InspectedType<A2>>,
  F extends Key,
  D extends RealObject = RealObject
>(
  data: D,
  field: F,
  fieldValueAssertion1: A1,
  fieldValueAssertion2: A2
): asserts data is D & { [k in F]: O };

/**
 * Asserts that an object has a specified property whose values satisfies the three given assertions.
 *
 * @typeparam O The type that the property value is asserted to have by this function.
 * @typeparam F the property name.
 * @typeparam A1 the TypeAssertion that is first applied to the property value, (assuming the property value exists).
 * If this assertion passes, then the value will be further asserted against an assertion of type A2, then A3, so the type that
 * is asserted by A1 should be the same as the input type to A2.
 * @typeparam A2 The TypeAssertion that is applied second to the property value, if it has passed previous assertions.
 * @typeparam A3 The TypeAssertion that is applied third to the property value, if it has passed previous assertions.
 * This is the last type assertion for the property value, so the type asserted by this is the type for the property value
 * that is asserted by the function.
 * @typeparam D The type of the data that is being inspected by this function.
 */
export function assertObjectHasOwnProperty<
  O extends AssertedType<A3>,
  A3 extends TypeAssertion,
  A2 extends TypeAssertion<InspectedType<A3>>,
  A1 extends TypeAssertion<InspectedType<A2>>,
  F extends Key,
  D extends RealObject = RealObject
>(
  data: D,
  field: F,
  fieldValueAssertion1: A1,
  fieldValueAssertion2: A2,
  fieldValueAssertion3: A3
): asserts data is D & { [k in F]: O };

/**
 * Asserts that an object has a specified property whose values satisfies the four given assertions.
 *
 * Note that the field assertions form a chain, so that the type asserted for the field by the first assertion is refined
 * by the second, which is further refined by the third, and so on.
 *
 * If you want to use more than four assertions, you can combine then with `composeTypeAssertions`.
 *
 * @typeparam O The type that the property value is asserted to have by this function.
 * @typeparam F the property name.
 * @typeparam A1 the TypeAssertion that is first applied to the property value, (assuming the property value exists).
 * If this assertion passes, then the value will be further asserted against an assertion of type A2, then A3,, then A4, so the type that
 * is asserted by A1 should be the same as the input type to A2.
 * @typeparam A2 The TypeAssertion that is applied second to the property value, if it has passed previous assertions.
 * @typeparam A3 The TypeAssertion that is applied third to the property value, if it has passed previous assertions.
 * @typeparam A4 The TypeAssertion that is applied fourth to the property value, if it has passed previous assertions.
 * This is the last type assertion for the property value, so the type asserted by this is the type for the property value
 * that is asserted by the function.
 * @typeparam D The type of the data that is being inspected by this function.
 */
export function assertObjectHasOwnProperty<
  O extends AssertedType<A4>,
  A4 extends TypeAssertion,
  A3 extends TypeAssertion<InspectedType<A4>>,
  A2 extends TypeAssertion<InspectedType<A3>>,
  A1 extends TypeAssertion<InspectedType<A2>>,
  F extends Key,
  D extends RealObject = RealObject
>(
  data: D,
  field: F,
  fieldValueAssertion1: A1 = noopAssert as A1,
  fieldValueAssertion2: A2 = noopAssert as A2,
  fieldValueAssertion3: A3 = noopAssert as A3,
  fieldValueAssertion4: A4 = noopAssert as A4
): asserts data is D & { [k in F]: O } {
  if (!Object.hasOwnProperty.call(data, field)) {
    throw namedError(
      "TypeAssertionError",
      `Expected object to have own property "${String(
        field
      )}", but no such property was found.`,
      { field }
    );
  }
  const fieldValue: D[F] = data[field];
  try {
    fieldValueAssertion1(fieldValue);
    fieldValueAssertion2(fieldValue);
    fieldValueAssertion3(fieldValue);
    fieldValueAssertion4(fieldValue);
  } catch (error) {
    throw wrapError(
      error,
      null,
      (c) => `For property "${String(field)}": ${c.message}`,
      { field, fieldValue }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noopAssert<T = unknown>(d: T): asserts d is T {}

export function composeTypeAssertions<
  O extends I & AssertedType<A2>,
  A2 extends TypeAssertion,
  A1 extends TypeAssertion<InspectedType<A2>>,
  I extends InspectedType<A1>
>(first: A1, second: A2): (data: I) => asserts data is O {
  return (value: I): asserts value is O => {
    first(value);
    second(value);
  };
}

export function typeCheckExhaustion<T>(param: T): void {
  void param;
}

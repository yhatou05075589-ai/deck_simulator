from flask import Flask, jsonify, render_template, request

from calculate import simulate_probability

app = Flask(__name__)


def calculate_probability(
    deck_count: int, hand_count: int, resource_count: int, records: dict, priority: list
) -> dict:
    """
    デッキ枚数・初手枚数・リソース枚数・登録カード情報から確率を計算する。
    """
    simulation = simulate_probability(
        deck_count, hand_count, resource_count, records, priority
    )
    return {
        **simulation,
        "deckCount": deck_count,
        "handCount": hand_count,
        "resourceCount": resource_count,
        "records": records,
        "priority": priority,
    }


def generate_advice(
    deck_count: int, hand_count: int, resource_count: int, records: dict, priority: list
) -> dict:
    """
    現在のデッキ構成からAIアドバイスを生成する。
    """
    # TODO: AIアドバイス生成処理を実装する
    return {"result": "AI アドバイスの結果はここに表示される予定です。"}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True) or {}
    try:
        result = calculate_probability(
            deck_count=data.get("deckCount", 0),
            hand_count=data.get("handCount", 0),
            resource_count=data.get("resourceCount", 0),
            records=data.get("records", {}),
            priority=data.get("priority", []),
        )
    except ValueError as e:
        # 入力値の不整合(枚数超過など)はメッセージをフロントへ返す
        return jsonify({"error": str(e)}), 400
    return jsonify({"result": result})


@app.route("/api/advice", methods=["POST"])
def advice():
    data = request.get_json(silent=True) or {}
    result = generate_advice(
        deck_count=data.get("deckCount", 0),
        hand_count=data.get("handCount", 0),
        resource_count=data.get("resourceCount", 0),
        records=data.get("records", {}),
        priority=data.get("priority", []),
    )
    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(debug=True)

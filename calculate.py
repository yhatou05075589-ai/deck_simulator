import random


# =========================================================
# デッキ作成
# =========================================================
def build_deck(config):

    deck = []
    uid = 0

    # -------------------------
    # キーカード
    # -------------------------
    for card in config.get("key_cards", []):
        for _ in range(card["count"]):
            deck.append({"id": uid, "name": card["name"], "type": "key"})

            uid += 1

    # -------------------------
    # ドローカード
    # -------------------------
    for card in config.get("draw_cards", []):
        for _ in range(card["count"]):
            deck.append(
                {
                    "id": uid,
                    "name": card["name"],
                    "type": "draw",
                    "draw_count": card["draw_count"],
                    # 使用リソース
                    "resource_cost": card["resource_cost"],
                    # 使用優先順位
                    "priority": card["priority"],
                }
            )

            uid += 1

    # -------------------------
    # サーチカード
    # -------------------------
    for card in config.get("search_cards", []):
        for _ in range(card["count"]):
            deck.append(
                {
                    "id": uid,
                    "name": card["name"],
                    "type": "search",
                    "search_range": card["search_range"],
                    "after_search": card["after_search"],
                    # 使用リソース
                    "resource_cost": card["resource_cost"],
                    # 使用優先順位
                    "priority": card["priority"],
                }
            )

            uid += 1

    # -------------------------
    # その他カード
    # -------------------------
    other_count = config["deck_count"] - len(deck)

    if other_count < 0:
        raise ValueError("登録カードの合計枚数がデッキ枚数を超えています。")

    for _ in range(other_count):
        deck.append({"id": uid, "name": "その他", "type": "other"})

        uid += 1

    return deck


# =========================================================
# 次に使うカードを決める
# =========================================================
def choose_next_action(hand, used_ids, remaining_resource):

    available_cards = []
    for card in hand:
        # ドロー・サーチカードのみ
        if card["type"] not in ("draw", "search"):
            continue

        # 既に使用済み
        if card["id"] in used_ids:
            continue

        # リソース不足
        if card["resource_cost"] > remaining_resource:
            continue

        available_cards.append(card)

    # 使用可能カードがない
    if not available_cards:
        return None

    # =============================================
    # priorityが小さいカードを優先
    # =============================================
    available_cards.sort(key=lambda card: (card["priority"], card["id"]))

    return available_cards[0]


# =========================================================
# シミュレーション1回
# =========================================================
def simulate_once(config):

    # -------------------------
    # デッキ作成
    # -------------------------
    deck = build_deck(config)

    random.shuffle(deck)

    # -------------------------
    # 初手
    # -------------------------
    hand_count = config["hand_count"]

    if hand_count > len(deck):
        raise ValueError("初手枚数がデッキ枚数を超えています。")

    hand = deck[:hand_count]

    deck = deck[hand_count:]

    # -------------------------
    # 使用可能リソース
    # -------------------------
    remaining_resource = config["resource_count"]

    # -------------------------
    # 初手にキーカード
    # -------------------------
    if any(card["type"] == "key" for card in hand):
        return True

    # 使用済みカード
    used_ids = set()

    # =====================================================
    # カードを使える限り繰り返す
    # =====================================================
    while True:
        action_card = choose_next_action(hand, used_ids, remaining_resource)

        # 使用できるカードがない
        if action_card is None:
            return False

        # =================================================
        # カードを使用
        # =================================================

        used_ids.add(action_card["id"])

        # -------------------------
        # リソース消費
        # -------------------------
        remaining_resource -= action_card["resource_cost"]

        # =================================================
        # ドローカード
        # =================================================
        if action_card["type"] == "draw":
            draw_count = action_card["draw_count"]

            draw_amount = min(draw_count, len(deck))

            drawn_cards = deck[:draw_amount]

            deck = deck[draw_amount:]

            # 手札に追加
            hand.extend(drawn_cards)

            # キーカードを引いた
            if any(card["type"] == "key" for card in drawn_cards):
                return True

        # =================================================
        # サーチカード
        # =================================================
        elif action_card["type"] == "search":
            search_range = action_card["search_range"]

            search_amount = min(search_range, len(deck))

            searched_cards = deck[:search_amount]

            # -------------------------
            # キーカード発見
            # -------------------------
            if any(card["type"] == "key" for card in searched_cards):
                return True

            # =================================================
            # サーチ後処理
            # =================================================

            after_search = action_card["after_search"]

            # -------------------------
            # 山札の下へ
            # -------------------------
            if after_search == "bottom":
                deck = deck[search_amount:] + searched_cards

            # -------------------------
            # シャッフル
            # -------------------------
            elif after_search == "shuffle":
                random.shuffle(deck)

            else:
                raise ValueError(f"未対応のサーチ後処理です: {after_search}")


# =========================================================
# フロントエンドの値をシミュレーション用 config に変換
# =========================================================
def build_config(deck_count, hand_count, resource_count, records, priority):

    if not records.get("key"):
        raise ValueError("キーカードが登録されていません。キーカードを登録してください。")

    # 優先順位(id -> order)。小さいほど優先
    order_by_id = {rec["id"]: rec["order"] for rec in priority}

    def get_priority(rec):
        return order_by_id.get(rec["id"], rec["order"])

    return {
        "deck_count": deck_count,
        "hand_count": hand_count,
        "resource_count": resource_count,
        "key_cards": [
            {"name": rec["name"], "count": rec["count"]}
            for rec in records.get("key", [])
        ],
        "draw_cards": [
            {
                "name": rec["name"],
                "count": rec["count"],
                "draw_count": rec["drawCount"],
                "resource_cost": rec["resourcePoint"],
                "priority": get_priority(rec),
            }
            for rec in records.get("draw", [])
        ],
        "search_cards": [
            {
                "name": rec["name"],
                "count": rec["count"],
                "search_range": rec["searchRange"],
                "after_search": rec["searchAction"],
                "resource_cost": rec["resourcePoint"],
                "priority": get_priority(rec),
            }
            for rec in records.get("search", [])
        ],
    }


# =========================================================
# 確率計算
# =========================================================
def simulate_probability(
    deck_count, hand_count, resource_count, records, priority, simulations=10000
):

    config = build_config(deck_count, hand_count, resource_count, records, priority)

    success_count = 0

    for _ in range(simulations):
        result = simulate_once(config)

        if result:
            success_count += 1

    failure_count = simulations - success_count

    probability = success_count / simulations * 100

    return {
        "success": success_count,
        "failure": failure_count,
        "simulations": simulations,
        "probability": probability,
    }

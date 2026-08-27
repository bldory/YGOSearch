let cardDatabase = [];

// 조건식 매칭 함수
function fnMatchSearch(targetCard, searchCondition) {
  if (!searchCondition) return false;

  if (searchCondition.level) {
    if (
      searchCondition.level.max &&
      targetCard.level > searchCondition.level.max
    )
      return false;
    if (
      searchCondition.level.min &&
      targetCard.level < searchCondition.level.min
    )
      return false;
  }

  if (searchCondition.type) {
    const isTypeMatches = searchCondition.type.every(
      (t) => targetCard.type && targetCard.type.includes(t),
    );
    if (!isTypeMatches) return false;
  }

  if (searchCondition.att)
    if (searchCondition.att != targetCard.att) return false;
  if (searchCondition.card)
    if (searchCondition.card != targetCard.card) return false;
  if (searchCondition.name)
    if (searchCondition.name != targetCard.name) return false;

  return true;
}

// 초기화 및 이벤트 리스너 등록
window.onload = async function () {
  try {
    const response = await fetch("cards.json");
    cardDatabase = await response.json();

    const inputField = document.getElementById("cardInput");

    // 실시간 입력에 따른 자동완성 기능 구현
    inputField.addEventListener("input", function () {
      const val = this.value.trim();
      const listContainer = document.getElementById("autocompleteList");
      listContainer.innerHTML = "";

      if (!val) return;

      const matches = cardDatabase.filter((c) =>
        c.name.toLowerCase().includes(val.toLowerCase()),
      );

      matches.forEach((match) => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("autocomplete-item");
        itemDiv.textContent = `${match.name} [${match.card}]`;
        itemDiv.addEventListener("click", function () {
          inputField.value = match.name;
          listContainer.innerHTML = "";
          selectAndDisplayCard(match.name);
        });
        listContainer.appendChild(itemDiv);
      });
    });

    // 엔터 키 입력 시 조회 처리
    inputField.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        document.getElementById("autocompleteList").innerHTML = "";
        onSearchCard();
      }
    });

    // 외부 클릭 시 자동완성 닫기
    document.addEventListener("click", function (e) {
      if (e.target !== inputField) {
        document.getElementById("autocompleteList").innerHTML = "";
      }
    });
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
};

// 조회 버튼 클릭 시 실행
function onSearchCard() {
  const inputName = document.getElementById("cardInput").value.trim();
  selectAndDisplayCard(inputName);
}

// 특정 카드 명칭을 기반으로 화면에 데이터를 렌더링하는 핵심 함수
function selectAndDisplayCard(cardName) {
  const detailsDiv = document.getElementById("cardDetails");
  const selectedCard = cardDatabase.find((c) => c.name === cardName);

  if (!selectedCard) {
    detailsDiv.style.display = "none";
    alert("해당 명칭의 카드가 데이터베이스에 존재하지 않습니다.");
    return;
  }

  detailsDiv.style.display = "block";

  // 1. 카드 프로필 렌더링 (줄바꿈 유지 적용)
  let profileHtml = `<h3>${selectedCard.name}</h3>`;

  // 첫 번째 줄: (레벨|랭크|링크), 속성, ?스케일
  let levelRankLinkStr = "";

  if (selectedCard.level) levelRankLinkStr = `레벨 ${selectedCard.level}`;
  else if (selectedCard.rank) levelRankLinkStr = `랭크 ${selectedCard.rank}`;
  else if (selectedCard.link) levelRankLinkStr = `링크 ${selectedCard.link}`;
  else levelRankLinkStr = "";

  let attrStr = selectedCard.att || "";

  let scaleStr =
    selectedCard.scale !== undefined ? `스케일 ${selectedCard.scale}` : "";

  profileHtml += `<p class="card-line-1">${levelRankLinkStr} ${attrStr} ${scaleStr}</p>`;

  // 두 번째 줄: [목록] 공격력 / 수비력

  let typeListStr = Array.isArray(selectedCard.type)
    ? selectedCard.type.join(" / ")
    : selectedCard.type || "-";

  let atkDefStr =
    selectedCard.atk !== undefined
      ? `${selectedCard.atk} / ${selectedCard.def}`
      : "";
  profileHtml += `<p class="card-line-2">[ ${typeListStr} ] ${atkDefStr}</p>`;

  // 세 번째 줄: ?펜듈럼효과
  if (selectedCard.pendulumEffect) {
    profileHtml += `<p class="card-line-3">[펜듈럼 효과] ${selectedCard.pendulumEffect}</p>`;
  }

  // 네 번째 줄: 텍스트 (줄바꿈 유지)
  let cardText =
    selectedCard.text ||
    selectedCard.desc ||
    "상세 텍스트가 존재하지 않습니다.";
  profileHtml += `<p class="card-line-4">${cardText}</p>`;

  document.getElementById("cardProfile").innerHTML = profileHtml;

  // 2. 후행 연계 카드 (내가 불러오는 카드)
  const outgoingList = document.getElementById("outgoingList");
  outgoingList.innerHTML = "";
  let outgoingCount = 0;

  cardDatabase.forEach((other) => {
    if (selectedCard.search) {
      if (
        fnMatchSearch(other, selectedCard.search) &&
        !fnMatchSearch(other, selectedCard.exception)
      ) {
        let li = document.createElement("li");
        li.textContent = other.name;
        li.onclick = () => {
          selectAndDisplayCard(other.name);
        };
        outgoingList.appendChild(li);
        outgoingCount++;
      }
    }
  });
  if (outgoingCount === 0) {
    outgoingList.innerHTML = `<li class="empty">해당 조건에 부합하는 후행 카드가 없습니다.</li>`;
  }

  // 3. 선행 연계 카드 (나를 불러오는 카드)
  const incomingList = document.getElementById("incomingList");
  incomingList.innerHTML = "";
  let incomingCount = 0;

  cardDatabase.forEach((other) => {
    if (other.search) {
      if (
        fnMatchSearch(selectedCard, other.search) &&
        !fnMatchSearch(other, selectedCard.exception)
      ) {
        let listEle = document.createElement("div");
        listEle.textContent = `${other.search.from} → ${other.search.to} ${other.name}`;
        listEle.onclick = () => {
          selectAndDisplayCard(other.name);
        };
        incomingList.appendChild(listEle);
        incomingCount++;
      }
    }
  });
  if (incomingCount === 0) {
    incomingList.innerHTML = `<li class="empty">해당 카드를 지정하는 선행 카드가 없습니다.</li>`;
  }
}

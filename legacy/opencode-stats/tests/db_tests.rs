//! Tests de db.rs (lectura) — fixture compartido con admin_tests.

use opencode_stats::db;
use opencode_stats::types::Group;

mod common;
use common::{count, with_db};

#[test]
fn test_load_sessions_basic() {
    with_db(|con, _| {
        let s = db::load_sessions(con, "", "", "").unwrap();
        assert_eq!(s.len(), 2);
        let old = s.iter().find(|x| x.id == "s_old").unwrap();
        assert_eq!(old.title, "Sesión vieja");
        assert_eq!(old.model, "deepseek-v4-flash");
        assert_eq!(old.input, 1000);
        assert_eq!(old.output, 500);
        assert_eq!(old.cost, 1.5);
        assert!(!old.archived);
        let new = s.iter().find(|x| x.id == "s_new").unwrap();
        assert_eq!(new.model, "gpt-5.6-luna");
    });
}

#[test]
fn test_load_sessions_filters() {
    with_db(|con, _| {
        // since de ayer: s_old (90 días atrás) queda fuera
        let since = chrono::Local::now()
            .checked_sub_days(chrono::Days::new(2))
            .unwrap()
            .format("%Y-%m-%d")
            .to_string();
        let s = db::load_sessions(con, &since, "", "").unwrap();
        assert_eq!(s.len(), 1);
        assert_eq!(s[0].id, "s_new");
        // filtro model substring
        let s = db::load_sessions(con, "", "", "flash").unwrap();
        assert_eq!(s.len(), 1);
        assert_eq!(s[0].id, "s_old");
        // hasta inclusivo: hasta ayer excluye s_new (hace 1h)
        let until = chrono::Local::now()
            .checked_sub_days(chrono::Days::new(1))
            .unwrap()
            .format("%Y-%m-%d")
            .to_string();
        let s = db::load_sessions(con, "", &until, "").unwrap();
        assert_eq!(s.len(), 1);
        assert_eq!(s[0].id, "s_old");
    });
}

#[test]
fn test_model_id() {
    assert_eq!(
        db::model_id(Some(r#"{"id":"deepseek-v4-flash"}"#)),
        "deepseek-v4-flash"
    );
    assert_eq!(db::model_id(Some("raw-model")), "raw-model");
    assert_eq!(db::model_id(None), "(sin modelo)");
    assert_eq!(db::model_id(Some("")), "(sin modelo)");
}

#[test]
fn test_parse_date() {
    use chrono::TimeZone;
    let ms = db::parse_date("2024-01-01").unwrap();
    let dt = chrono::Local
        .timestamp_millis_opt(ms)
        .unwrap()
        .naive_local();
    assert_eq!(dt.format("%Y-%m-%d").to_string(), "2024-01-01");
}

#[test]
fn test_project_names() {
    with_db(|con, _| {
        let names = db::project_names(con).unwrap();
        assert_eq!(names.get("p1").unwrap(), "Proy  [G:/proy]");
    });
}

#[test]
fn test_request_counts() {
    db::clear_request_cache();
    with_db(|con, _| {
        // seed con message role=user: no debería contar
        let s = db::load_sessions(con, "", "", "").unwrap();
        let c = db::get_request_counts(con, &s).unwrap();
        assert_eq!(c.get("s_old").unwrap(), &0);
        // agregar un mensaje assistant con part text: cuenta 1
        con.execute(
            "INSERT INTO message VALUES ('msg_a1','s_old',1,1,'{\"id\":\"msg_a1\",\"role\":\"assistant\"}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('prt_a1','msg_a1','s_old',1,1,'{\"id\":\"prt_a1\",\"type\":\"text\",\"text\":\"hola\"}')",
            [],
        )
        .unwrap();
        db::clear_request_cache();
        let s = db::load_sessions(con, "", "", "").unwrap();
        let c = db::get_request_counts(con, &s).unwrap();
        assert_eq!(c.get("s_old").unwrap(), &1);
    });
}

#[test]
fn test_request_counts_incremental() {
    db::clear_request_cache();
    with_db(|con, _| {
        // full scan inicial: el seed no tiene respuestas de asistente
        let s = db::load_sessions(con, "", "", "").unwrap();
        let c = db::get_request_counts(con, &s).unwrap();
        assert_eq!(c.get("s_old").unwrap(), &0);
        // la DB "crece": part nueva con time_updated futuro y session.updated actualizado
        let future = crate::common::now_ms() + 60_000;
        con.execute(
            &format!("INSERT INTO message VALUES ('msg_a1','s_old',{future},{future},'{{\"id\":\"msg_a1\",\"role\":\"assistant\"}}')"),
            [],
        )
        .unwrap();
        con.execute(
            &format!("INSERT INTO part VALUES ('prt_a1','msg_a1','s_old',{future},{future},'{{\"id\":\"prt_a1\",\"type\":\"text\",\"text\":\"hola\"}}')"),
            [],
        )
        .unwrap();
        con.execute(
            "UPDATE session SET time_updated=?1 WHERE id='s_old'",
            [future],
        )
        .unwrap();
        // SIN clear: el incremental suma solo la fila nueva
        let s = db::load_sessions(con, "", "", "").unwrap();
        let c = db::get_request_counts(con, &s).unwrap();
        assert_eq!(c.get("s_old").unwrap(), &1);
        // cache hit: misma newest → mismo resultado sin re-scan
        let c = db::get_request_counts(con, &s).unwrap();
        assert_eq!(c.get("s_old").unwrap(), &1);
        db::clear_request_cache();
    });
}

#[test]
fn test_aggregate_and_totals() {
    with_db(|con, _| {
        let s = db::load_sessions(con, "", "", "").unwrap();
        let t = db::totals(&s);
        assert_eq!(t.input, 2000);
        assert_eq!(t.output, 1000);
        assert_eq!(t.n, 2);
        let g = db::aggregate(&s, |x| x.model.clone());
        assert_eq!(g.len(), 2);
        assert_eq!(g["deepseek-v4-flash"].n, 1);
        assert_eq!(g["deepseek-v4-flash"].cost, 1.5);
        let by_model = db::by_model(&s, 15);
        assert_eq!(by_model.len(), 2);
        assert_eq!(by_model[0].0, "gpt-5.6-luna"); // cost 3.2 > 1.5
    });
}

#[test]
fn test_by_project_day_month() {
    with_db(|con, _| {
        let s = db::load_sessions(con, "", "", "").unwrap();
        let by_proj = db::by_project(con, &s, 15).unwrap();
        assert_eq!(by_proj[0].0, "Proy  [G:/proy]");
        assert_eq!(by_proj[0].1.n, 2);
        let by_day = db::by_day(&s, 60);
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let old_day = chrono::Local::now()
            .checked_sub_days(chrono::Days::new(90))
            .unwrap()
            .format("%Y-%m-%d")
            .to_string();
        let keys: Vec<&str> = by_day.iter().map(|(k, _)| k.as_str()).collect();
        assert!(keys.contains(&today.as_str()));
        assert!(keys.contains(&old_day.as_str()));
        assert!(by_day[0].0 > by_day[1].0); // sort clave desc
        let by_month = db::by_month(&s);
        assert_eq!(by_month.len(), 2);
    });
}

#[test]
fn test_top_sessions_and_stats() {
    with_db(|con, _| {
        let s = db::load_sessions(con, "", "", "").unwrap();
        let top = db::top_sessions(&s, 40);
        assert_eq!(top[0].id, "s_new");
        let t = db::totals(&s);
        let st = db::stats(&s, &t).unwrap();
        assert_eq!(st.sesiones, 2);
        assert_eq!(st.modelos, 2);
        assert!((st.costo_medio_sesion - 2.35).abs() < 1e-9);
        assert_eq!(st.primera, s.iter().map(|x| x.created).min().unwrap());
        assert_eq!(st.ultima, s.iter().map(|x| x.updated).max().unwrap());
        assert_eq!(st.sesion_mas_cara.id, "s_new");
        assert_eq!(st.sesion_mas_tokens.id, "s_new"); // input+cache_read mayor
        // stats vacío → None
        assert!(db::stats(&[], &Group::default()).is_none());
    });
}

#[test]
fn test_groups_total_is_count() {
    with_db(|con, _| {
        let s = db::load_sessions(con, "", "", "").unwrap();
        let g = db::aggregate(&s, |x| x.project_id.clone());
        assert_eq!(g["p1"].n, 2);
        assert_eq!(count(con, "session", "1=1"), 2);
    });
}

#[test]
fn test_until_inclusive_plus_86400000() {
    // hasta HOY incluye la sesión creada hoy (s_new creada hace 1h)
    with_db(|con, _| {
        let until = chrono::Local::now().format("%Y-%m-%d").to_string();
        let s = db::load_sessions(con, "", &until, "").unwrap();
        assert_eq!(s.len(), 2);
    });
}

#[test]
fn test_by_tool() {
    with_db(|con, _| {
        // turno 1: 1 tool (bash) con tokens completos del step-finish
        con.execute(
            "INSERT INTO message VALUES ('msg_t1','s_old',1,1,'{\"id\":\"msg_t1\",\"role\":\"assistant\"}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t1a','msg_t1','s_old',1,1,'{\"id\":\"p_t1a\",\"type\":\"step-finish\",\"reason\":\"tool-calls\",\"tokens\":{\"input\":100,\"output\":10,\"reasoning\":1,\"cache\":{\"read\":5,\"write\":0}}}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t1b','msg_t1','s_old',1,1,'{\"id\":\"p_t1b\",\"type\":\"tool\",\"tool\":\"bash\"}')",
            [],
        )
        .unwrap();
        // turno 2: 2 tools (edit + bash) → reparto equitativo del turno
        con.execute(
            "INSERT INTO message VALUES ('msg_t2','s_old',2,2,'{\"id\":\"msg_t2\",\"role\":\"assistant\"}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t2a','msg_t2','s_old',2,2,'{\"id\":\"p_t2a\",\"type\":\"step-finish\",\"reason\":\"tool-calls\",\"tokens\":{\"input\":200,\"output\":20,\"reasoning\":0,\"cache\":{\"read\":10,\"write\":2}}}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t2b','msg_t2','s_old',2,2,'{\"id\":\"p_t2b\",\"type\":\"tool\",\"tool\":\"edit\"}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t2c','msg_t2','s_old',2,2,'{\"id\":\"p_t2c\",\"type\":\"tool\",\"tool\":\"bash\"}')",
            [],
        )
        .unwrap();
        // step-finish sin tool-calls: no se atribuye a ninguna herramienta
        con.execute(
            "INSERT INTO message VALUES ('msg_t3','s_old',3,3,'{\"id\":\"msg_t3\",\"role\":\"assistant\"}')",
            [],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES ('p_t3a','msg_t3','s_old',3,3,'{\"id\":\"p_t3a\",\"type\":\"step-finish\",\"reason\":\"end\",\"tokens\":{\"input\":999,\"output\":0,\"reasoning\":0,\"cache\":{\"read\":0,\"write\":0}}}')",
            [],
        )
        .unwrap();

        let s = db::load_sessions(con, "", "", "").unwrap();
        let v = db::by_tool(con, &s).unwrap();
        // bash: turno1 completo (100/10/1/5) + mitad del turno2 (100/10/0/5/1)
        let bash = v.iter().find(|u| u.tool == "bash").unwrap();
        assert_eq!(bash.calls, 2);
        assert_eq!(bash.input, 200.0);
        assert_eq!(bash.output, 20.0);
        assert_eq!(bash.reasoning, 1.0);
        assert_eq!(bash.cache_read, 10.0);
        assert_eq!(bash.cache_write, 1.0);
        // edit: mitad del turno2
        let edit = v.iter().find(|u| u.tool == "edit").unwrap();
        assert_eq!(edit.calls, 1);
        assert_eq!(edit.input, 100.0);
        assert_eq!(edit.output, 10.0);
        assert_eq!(edit.cache_write, 1.0);
        // costo estimado: mismo modelo, más tokens → más caro (puede no ser lineal por tramos)
        assert!(bash.cost > 0.0);
        assert!(bash.cost > edit.cost);
        // ordenado de mayor a menor por costo
        assert!(v.windows(2).all(|w| w[0].cost >= w[1].cost));
        assert_eq!(v.len(), 2);
    });
}
